import { useState } from 'react';
import { clearSupabaseTokens } from '../utils/authUtils';

interface LoadingScreenProps {
  message?: string;
  showRetry?: boolean;
  onRetry?: () => void;
}

export default function LoadingScreen({ 
  message = "Loading...", 
  showRetry = false,
  onRetry 
}: LoadingScreenProps) {
  const [isClearing, setIsClearing] = useState(false);

  const handleClearTokens = () => {
    setIsClearing(true);
    clearSupabaseTokens();
    setTimeout(() => {
      setIsClearing(false);
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-6">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">{message}</h2>
          <p className="text-gray-600">Please wait while we load your data...</p>
        </div>
        
        {showRetry && (
          <div className="space-y-3">
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
            <div className="text-sm text-gray-500">
              Still having issues?{' '}
              <button
                onClick={handleClearTokens}
                disabled={isClearing}
                className="text-blue-600 hover:text-blue-700 underline disabled:opacity-50"
              >
                {isClearing ? 'Clearing...' : 'Clear authentication data'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
