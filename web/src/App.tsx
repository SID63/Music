import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './components/theme-provider';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import { ApiProvider } from './context/ApiContext';
import { ToastProvider } from './components/ui/toast';
import './index.css';
import AppContent from './AppContent';

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="music-connect-theme">
      <Toaster position="top-center" richColors />
      <ApiProvider>
        <ToastProvider>
          <BrowserRouter>
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </BrowserRouter>
        </ToastProvider>
      </ApiProvider>
    </ThemeProvider>
  );
}



