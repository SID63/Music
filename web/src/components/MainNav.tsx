import { Link, useLocation } from 'react-router-dom';

export default function MainNav() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { to: '/musicians', label: 'Musicians', icon: '🎵' },
    { to: '/bands', label: 'Bands', icon: '🎸' },
    { to: '/events', label: 'Events', icon: '📅' },
    { to: '/messages', label: 'Messages', icon: '💬' },
  ];

  return (
    <nav className="hidden md:flex items-center gap-3">
      {navItems.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className={`
            relative px-5 py-3 rounded-2xl font-medium transition-all duration-300 group overflow-hidden
            ${isActive(item.to)
              ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white shadow-xl shadow-blue-500/25'
              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100/80'
            }
          `}
        >
          <span className="flex items-center gap-3 relative z-10">
            <span className="text-xl filter drop-shadow-sm">{item.icon}</span>
            <span className="font-semibold">{item.label}</span>
          </span>
          
          {/* Active indicator */}
          {isActive(item.to) && (
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-1 bg-white rounded-full opacity-80"></div>
          )}
          
          {/* Hover effect */}
          {!isActive(item.to) && (
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 scale-95 group-hover:scale-100"></div>
          )}

          {/* Subtle border for non-active items */}
          {!isActive(item.to) && (
            <div className="absolute inset-0 rounded-2xl border border-gray-200/50 group-hover:border-gray-300/70 transition-colors duration-300"></div>
          )}
        </Link>
      ))}
    </nav>
  );
}
