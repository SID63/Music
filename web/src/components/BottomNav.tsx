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
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 ui-glass ui-vibrant-border">
      <ul className="grid grid-cols-5">
        {navItems.map(({ to, label, Icon }) => {
          const active = isActive(to);
          return (
            <li key={to}>
              <Link
                to={to}
                className={`flex flex-col items-center justify-center py-2.5 gap-1 text-xs transition-colors ${
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className={`h-5 w-5 ${active ? '' : 'opacity-90'}`} />
                <span className="leading-none">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
