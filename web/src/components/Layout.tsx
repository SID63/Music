import { Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
// Using emoji as a fallback for now
import MainNav from './MainNav';
import { ModeToggle } from './mode-toggle';
import AuthNav from './AuthNav';
import { cn } from '@/lib/utils';
import { AppearanceProvider } from './AppearanceProvider';
import BottomNav from './BottomNav';

export default function Layout() {
  return (
    <AppearanceProvider>
      <div className="min-h-screen bg-background font-sans antialiased relative app-flair overflow-x-hidden">
        <header
          className="w-full z-50 ui-glass-strong ui-vibrant-border md:fixed md:top-0 md:inset-x-0"
          role="banner"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="container flex h-16 items-center justify-between px-4">
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

        <main className="container py-6 pb-24 px-3 sm:px-0 md:pt-20">
          <Outlet />
        </main>

        <footer
          className="py-6 mt-12 ui-glass ui-vibrant-border"
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
