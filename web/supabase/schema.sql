-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table: both musicians and organizers
create table if not exists public.profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid unique references auth.users(id) on delete cascade,
  role text not null check (role in ('musician','organizer')),
  display_name text,
  is_band boolean,
  genres text[],
  location text,
  price_min integer,
  price_max integer,
  youtube_url text,
  bio text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Anyone can read public profiles
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles
  for select using (true);

-- Logged-in user can manage their own profile row
drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert with check (auth.uid() = user_id);

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Events posted by organizers
create table if not exists public.events (
  id uuid primary key default uuid_generate_v4(),
  organizer_profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  budget_min integer,
  budget_max integer,
  created_at timestamptz not null default now()
);

create index if not exists events_starts_at_idx on public.events (starts_at desc);
alter table public.events enable row level security;

-- Anyone can read events
drop policy if exists events_read on public.events;
create policy events_read on public.events
  for select using (true);

-- Only organizers can create events for themselves
drop policy if exists events_insert on public.events;
create policy events_insert on public.events
  for insert with check (
    exists (
      select 1 from public.profiles p
      where p.id = organizer_profile_id
        and p.user_id = auth.uid()
        and p.role = 'organizer'
    )
  );

-- Only owner can update/delete their events
drop policy if exists events_update on public.events;
create policy events_update on public.events
  for update using (
    exists (
      select 1 from public.profiles p
      where p.id = organizer_profile_id and p.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.profiles p
      where p.id = organizer_profile_id and p.user_id = auth.uid()
    )
  );

drop policy if exists events_delete on public.events;
create policy events_delete on public.events
  for delete using (
    exists (
      select 1 from public.profiles p
      where p.id = organizer_profile_id and p.user_id = auth.uid()
    )
  );

-- Bookings between organizer event and musician
create table if not exists public.bookings (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid not null references public.events(id) on delete cascade,
  musician_profile_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','confirmed','declined','cancelled','completed')),
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  created_at timestamptz not null default now(),
  unique (event_id, musician_profile_id)
);

create index if not exists bookings_musician_time_idx on public.bookings (musician_profile_id, scheduled_start, scheduled_end);
alter table public.bookings enable row level security;

-- Prevent double bookings for the same musician when time windows overlap
create or replace function public.prevent_double_booking()
returns trigger as $$
begin
  if new.scheduled_start is null or new.scheduled_end is null then
    return new;
  end if;

  if new.status in ('pending','confirmed') then
    if exists (
      select 1 from public.bookings b
      where b.musician_profile_id = new.musician_profile_id
        and b.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
        and b.status in ('pending','confirmed')
        and b.scheduled_start is not null and b.scheduled_end is not null
        and tstzrange(b.scheduled_start, b.scheduled_end, '[)') && tstzrange(new.scheduled_start, new.scheduled_end, '[)')
    ) then
      raise exception 'Double booking detected for musician during the requested time window';
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_prevent_double_booking on public.bookings;
create trigger trg_prevent_double_booking
before insert or update on public.bookings
for each row execute function public.prevent_double_booking();

-- Participants can read their bookings
drop policy if exists bookings_read on public.bookings;
create policy bookings_read on public.bookings
  for select using (
    exists (
      select 1 from public.profiles m where m.id = musician_profile_id and m.user_id = auth.uid()
    ) or exists (
      select 1 from public.events e join public.profiles o on e.organizer_profile_id = o.id
      where e.id = bookings.event_id and o.user_id = auth.uid()
    )
  );

-- Organizer creates booking offers for their events; musician can update status
drop policy if exists bookings_insert on public.bookings;
create policy bookings_insert on public.bookings
  for insert with check (
    exists (
      select 1 from public.events e join public.profiles o on e.organizer_profile_id = o.id
      where e.id = event_id and o.user_id = auth.uid()
    )
  );

drop policy if exists bookings_update on public.bookings;
create policy bookings_update on public.bookings
  for update using (
    exists (
      select 1 from public.profiles m where m.id = musician_profile_id and m.user_id = auth.uid()
    ) or exists (
      select 1 from public.events e join public.profiles o on e.organizer_profile_id = o.id
      where e.id = bookings.event_id and o.user_id = auth.uid()
    )
  ) with check (true);

-- Messages between profiles
create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  sender_profile_id uuid not null references public.profiles(id) on delete cascade,
  recipient_profile_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_by_participants on public.messages (sender_profile_id, recipient_profile_id, created_at desc);
alter table public.messages enable row level security;

drop policy if exists messages_read on public.messages;
create policy messages_read on public.messages
  for select using (
    exists (
      select 1 from public.profiles p where p.id in (sender_profile_id, recipient_profile_id) and p.user_id = auth.uid()
    )
  );

drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages
  for insert with check (
    exists (
      select 1 from public.profiles p where p.id = sender_profile_id and p.user_id = auth.uid()
    )
  );

-- Reviews after completed bookings
create table if not exists public.reviews (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  reviewer_profile_id uuid not null references public.profiles(id) on delete cascade,
  reviewee_profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (booking_id, reviewer_profile_id)
);

alter table public.reviews enable row level security;

drop policy if exists reviews_read on public.reviews;
create policy reviews_read on public.reviews for select using (true);

drop policy if exists reviews_insert on public.reviews;
create policy reviews_insert on public.reviews
  for insert with check (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id and b.status = 'completed'
    ) and exists (
      select 1 from public.profiles p where p.id = reviewer_profile_id and p.user_id = auth.uid()
    )
  );


