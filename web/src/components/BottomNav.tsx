import { Link, useLocation } from 'react-router-dom';
import { Users, Guitar, CalendarDays, MessageSquare, User } from 'lucide-react';

const navItems = [
  { to: '/musicians', label: 'Musicians', Icon: Users },
  { to: '/bands', label: 'Bands', Icon: Guitar },
  { to: '/events', label: 'Events', Icon: CalendarDays },
  { to: '/messages', label: 'Messages', Icon: MessageSquare },
  { to: '/profile', label: 'Profile', Icon: User },
];

export default function BottomNav() {
  const location = useLocation();
  const isActive = (path: string) =>
    path === '/'
      ? location.pathname === '/'
      : location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <nav
      role="navigation"
      aria-label="Primary"
      className="md:hidden fixed bottom-4 z-[999] left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-md rounded-2xl ui-glass-strong ui-vibrant-border shadow-2xl ring-1 ring-border/60 backdrop-blur"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
    >
      <ul className="grid grid-cols-5">
        {navItems.map(({ to, label, Icon }) => {
          const active = isActive(to);
          return (
            <li key={to}>
              <Link
                to={to}
                className={`flex flex-col items-center justify-center py-3 min-h-12 gap-1 text-xs transition-colors ${
                  active
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                aria-current={active ? 'page' : undefined}
                aria-label={label}
              >
                <Icon className={`h-5 w-5 ${active ? 'text-primary' : ''}`} />
                <span className="text-[11px] leading-none">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
