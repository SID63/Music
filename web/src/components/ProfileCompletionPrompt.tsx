import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

type ProfileCompletionPromptProps = {
  feature: string;
  onClose: () => void;
};

export default function ProfileCompletionPrompt({ feature, onClose }: ProfileCompletionPromptProps) {
  const { profile } = useAuth();

  if (!profile) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" onClick={onClose} />
      
      {/* Prompt */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white text-center">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎵</span>
              </div>
              <h1 className="text-xl font-bold mb-2">Complete Your Profile</h1>
              <p className="text-blue-100 text-sm">To use {feature}, please complete your profile first</p>
            </div>
            
            {/* Content */}
            <div className="p-6">
              <div className="text-center space-y-4">
                <p className="text-gray-600">
                  Complete your profile to unlock all features and start connecting with the music community!
                </p>
                
                <div className="flex flex-col space-y-3">
                  <Link
                    to="/setup"
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    onClick={onClose}
                  >
                    Complete Profile Now
                  </Link>
                  
                  <button
                    onClick={onClose}
                    className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
