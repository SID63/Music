import { Outlet, Link } from 'react-router-dom';
import { Toaster } from 'sonner';
// Using emoji as a fallback for now
import MainNav from './MainNav';
import { useEffect, useState } from 'react';
import { ModeToggle } from './mode-toggle';
import AuthNav from './AuthNav';
import { cn } from '@/lib/utils';
import { AppearanceProvider } from './AppearanceProvider';
import BottomNav from './BottomNav';

export default function Layout() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <AppearanceProvider>
      <div className="min-h-screen bg-background font-sans antialiased relative app-flair overflow-x-hidden transform-none">
        {/* Mobile branding header */}
        <header
          className="md:hidden fixed top-0 inset-x-0 z-[100] h-16 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border"
          role="banner"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="container h-full px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎵</span>
              <span className="text-lg font-semibold">Music Connect</span>
            </div>
            <Link to="/profile" className="text-sm font-medium hover:underline">Profile</Link>
          </div>
        </header>
        <header
          className="hidden md:block fixed top-4 inset-x-0 z-[100] w-full bg-transparent pointer-events-none"
          role="banner"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className={`container max-w-6xl mx-auto flex h-16 items-center justify-between px-4 rounded-2xl ui-glass-strong ui-vibrant-border pointer-events-auto transition-shadow duration-200 ${scrolled ? 'shadow-2xl ring-1 ring-border/60' : 'shadow-xl'}`}>
            <div className="flex items-center gap-6">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🎵</span>
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Music Connect
                </span>
              </div>
              <MainNav />
            </div>
            <div className="flex items-center gap-4">
              <ModeToggle />
              <AuthNav />
            </div>
          </div>
        </header>

        <main className="container pt-16 py-6 pb-36 md:pb-16 px-3 sm:px-0 md:pt-24">
          <Outlet />
        </main>

        <footer
          className="hidden md:block py-6 mt-12 ui-glass ui-vibrant-border"
          role="contentinfo"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row md:py-0">
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
              &copy; {new Date().getFullYear()} Music Connect. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Terms
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Privacy
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Contact
              </a>
            </div>
          </div>
        </footer>
        
        <Toaster position="top-center" richColors />
        {/* Sticky bottom navigation for mobile */}
        <BottomNav />
      </div>
    </AppearanceProvider>
  );
}
