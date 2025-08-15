import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

export default function AuthNav() {
  const { user, profile, signOut, isProfileComplete } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center gap-4">
        <Link 
          to="/login" 
          className="text-gray-700 hover:text-gray-900 transition-all duration-300 font-medium px-5 py-3 rounded-2xl hover:bg-gray-100/80 border border-gray-200/50 hover:border-gray-300/70"
        >
          Log in
        </Link>
        <Link 
          to="/signup" 
          className="px-6 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 transition-all duration-300 font-medium shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
        >
          Sign up
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      {/* Profile completion indicator */}
      {!isProfileComplete(profile) && (
        <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
          <div className="w-3 h-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full animate-pulse"></div>
          <span className="text-amber-800 text-sm font-semibold">Complete Profile</span>
        </div>
      )}
      
      <div className="relative group">
        <button className="flex items-center gap-3 text-gray-700 hover:text-gray-900 transition-all duration-300 px-4 py-3 rounded-2xl hover:bg-gray-100/80 border border-gray-200/50 hover:border-gray-300/70">
          <div className="relative">
            <img
              src={profile?.avatar_url || `data:image/svg+xml;base64,${btoa(`
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="32" height="32" fill="#6B7280"/>
                  <text x="16" y="20" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="bold">U</text>
                </svg>
              `)}`}
              alt="Profile"
              className={`w-10 h-10 rounded-full object-cover border-2 transition-all duration-300 ${
                isProfileComplete(profile) ? 'border-gray-200' : 'border-amber-400'
              }`}
              onError={(e) => {
                e.currentTarget.src = `data:image/svg+xml;base64,${btoa(`
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="32" height="32" fill="#6B7280"/>
                    <text x="16" y="20" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="bold">U</text>
                  </svg>
                `)}`;
              }}
            />
            {!isProfileComplete(profile) && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-xs font-bold">!</span>
              </div>
            )}
          </div>
          <span className="font-semibold">{profile?.display_name || 'User'}</span>
          <svg className="w-5 h-5 transition-transform duration-300 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        <div className="absolute right-0 mt-3 w-60 bg-white rounded-3xl shadow-2xl border border-gray-200/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 transform origin-top-right scale-95 group-hover:scale-100 backdrop-blur-sm">
          <div className="p-3">
            <Link 
              to="/profile" 
              className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-2xl transition-all duration-300 group/item"
            >
              <svg className="w-5 h-5 text-gray-400 group-hover/item:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              My Profile
            </Link>
            <Link 
              to="/profile/edit" 
              className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 rounded-2xl transition-all duration-300 group/item"
            >
              <svg className="w-5 h-5 text-gray-400 group-hover/item:text-green-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Profile
            </Link>
            {!isProfileComplete(profile) && (
              <Link 
                to="/setup" 
                className="flex items-center gap-3 px-4 py-3 text-amber-700 hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 rounded-2xl transition-all duration-300 group/item"
              >
                <svg className="w-5 h-5 text-amber-500 group-hover/item:text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Complete Profile
              </Link>
            )}
            <div className="border-t border-gray-100 my-2"></div>
            <button 
              onClick={signOut}
              className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 rounded-2xl transition-all duration-300 group/item"
            >
              <svg className="w-5 h-5 text-red-500 group-hover/item:text-pink-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
