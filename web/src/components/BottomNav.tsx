import { Link, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
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

  const content = (
    <nav
      role="navigation"
      aria-label="Primary"
      className="md:hidden fixed bottom-0 inset-x-0 z-[99999] h-16 bg-background/95 supports-[backdrop-filter]:bg-background/70 backdrop-blur border-t border-border pointer-events-auto"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
      }}
    >
      <ul className="grid grid-cols-5 h-full max-w-full">
        {navItems.map(({ to, label, Icon }) => {
          const active = isActive(to);
          return (
            <li key={to}>
              <Link
                to={to}
                className={`flex h-full w-full min-w-0 flex-col items-center justify-center py-1 gap-0.5 text-[11px] transition-colors ${
                  active
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                aria-current={active ? 'page' : undefined}
                aria-label={label}
              >
                <Icon className={`h-[22px] w-[22px] ${active ? 'text-primary' : ''}`} />
                <span className="leading-none">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  // Render via portal to avoid parent stacking/overflow issues
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }
  return content;
}
