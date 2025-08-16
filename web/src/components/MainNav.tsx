import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Home, Users, Calendar, MessageSquare, Mic2 } from 'lucide-react';

type NavItem = {
  to: string;
  label: string;
  icon: React.ReactNode;
  matchExact?: boolean;
};

export default function MainNav() {
  const location = useLocation();

  const isActive = (path: string, exact = false) => {
    return exact ? location.pathname === path : location.pathname.startsWith(path);
  };

  const navItems: NavItem[] = [
    { to: '/musicians', label: 'Musicians', icon: <Mic2 className="h-5 w-5" /> },
    { to: '/bands', label: 'Bands', icon: <Users className="h-5 w-5" /> },
    { to: '/events', label: 'Events', icon: <Calendar className="h-5 w-5" /> },
    { to: '/messages', label: 'Messages', icon: <MessageSquare className="h-5 w-5" /> },
  ];

  return (
    <nav className="hidden md:flex items-center space-x-1" role="navigation" aria-label="Primary">
      {navItems.map((item) => {
        const active = isActive(item.to, item.matchExact);
        return (
          <Button
            key={item.to}
            asChild
            variant="ghost"
            size="lg"
            className={cn(
              'h-12 px-4 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-accent text-accent-foreground hover:bg-accent/90'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
              'group relative flex items-center gap-2 rounded-lg',
              'transition-all duration-200 ease-in-out',
              active ? 'shadow-sm' : ''
            )}
          >
            <Link to={item.to} className="relative" aria-current={active ? 'page' : undefined} aria-label={item.label}>
              <div className="flex items-center gap-2">
                <span className={cn(
                  'transition-transform duration-200',
                  active ? 'scale-110' : 'group-hover:scale-105'
                )}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {active && (
                <span className="absolute -bottom-1 left-1/2 h-1 w-6 -translate-x-1/2 rounded-full bg-primary" />
              )}
              {!active && (
                <div className="absolute inset-0 rounded-2xl border border-gray-200/50 group-hover:border-gray-300/70 transition-colors duration-300"></div>
              )}
            </Link>
          </Button>
        );
      })}
    </nav>
  );
}
