import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../context/AuthContext';

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, profile, signOut, isProfileComplete } = useAuth();

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

  const handleNavClick = () => {
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button aria-label="Open navigation" variant="outline" size="icon" className="rounded-2xl md:hidden w-11 h-11 min-h-11">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </Button>
      </SheetTrigger>
      
      <SheetContent side="left" className="w-80 p-0 bg-white/95 backdrop-blur-md border-r border-gray-200/50">
        <SheetHeader className="p-6 border-b border-gray-200/50">
          <SheetTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">🎵</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Music Connect
            </span>
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-full">
          {/* Navigation Items */}
          <nav className="flex-1 p-6">
            <div className="space-y-3">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={handleNavClick}
                  className={`
                    flex items-center gap-4 p-4 rounded-2xl font-medium transition-all duration-300 group
                    ${isActive(item.to)
                      ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100/80 border border-gray-200/50 hover:border-gray-300/70'
                    }
                  `}
                >
                  <span className="text-2xl filter drop-shadow-sm">{item.icon}</span>
                  <span className="font-semibold text-lg">{item.label}</span>
                  
                  {/* Active indicator */}
                  {isActive(item.to) && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full opacity-80"></div>
                  )}
                </Link>
              ))}
            </div>
          </nav>

          {/* User Section */}
          {user && (
            <div className="p-6 border-t border-gray-200/50 bg-gray-50/50">
              <div className="space-y-4">
                {/* Profile completion indicator */}
                {!isProfileComplete(profile) && (
                  <Badge variant="secondary" className="w-full justify-center bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 text-amber-800 hover:from-amber-100 hover:to-orange-100 px-4 py-3 text-sm">
                    <div className="w-3 h-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full animate-pulse mr-2"></div>
                    Complete Profile
                  </Badge>
                )}
                
                {/* User Profile */}
                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200/50">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {profile?.display_name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 truncate">
                      {profile?.display_name || 'User'}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {profile?.role || 'User'}
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-2">
                  <Button asChild variant="outline" className="w-full justify-start" size="sm">
                    <Link to="/profile" onClick={handleNavClick}>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      My Profile
                    </Link>
                  </Button>
                  
                  <Button asChild variant="outline" className="w-full justify-start" size="sm">
                    <Link to="/profile/edit" onClick={handleNavClick}>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Profile
                    </Link>
                  </Button>
                  
                  {!isProfileComplete(profile) && (
                    <Button asChild variant="outline" className="w-full justify-start" size="sm">
                      <Link to="/profile/edit" onClick={handleNavClick}>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Complete Profile
                      </Link>
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50" 
                    size="sm"
                    onClick={() => {
                      signOut();
                      handleNavClick();
                    }}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Guest Actions */}
          {!user && (
            <div className="p-6 border-t border-gray-200/50 bg-gray-50/50">
              <div className="space-y-3">
                <Button asChild variant="outline" className="w-full" size="lg">
                  <Link to="/login" onClick={handleNavClick}>
                    Log in
                  </Link>
                </Button>
                <Button asChild className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700" size="lg">
                  <Link to="/signup" onClick={handleNavClick}>
                    Sign up
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
