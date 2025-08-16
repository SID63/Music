import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';

export default function AuthNav() {
  const { user, profile, signOut, isProfileComplete } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="lg">
          <Link to="/login">
            Log in
          </Link>
        </Button>
        <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 shadow-xl hover:shadow-2xl transform hover:-translate-y-1">
          <Link to="/signup">
            Sign up
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      {/* Profile completion indicator */}
      {!isProfileComplete(profile) && (
        <Badge variant="secondary" className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 text-amber-800 hover:from-amber-100 hover:to-orange-100 px-4 py-2">
          <div className="w-3 h-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full animate-pulse mr-2"></div>
          Complete Profile
        </Badge>
      )}
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="lg" className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-gray-100/80 border border-gray-200/50 hover:border-gray-300/70">
            <div className="relative">
              <Avatar className="w-10 h-10 border-2 transition-all duration-300">
                <AvatarImage 
                  src={profile?.avatar_url} 
                  alt="Profile"
                  className={`${
                    isProfileComplete(profile) ? 'border-gray-200' : 'border-amber-400'
                  }`}
                />
                <AvatarFallback className="bg-gray-600 text-white">
                  {profile?.display_name?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              {!isProfileComplete(profile) && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
              )}
            </div>
            <span className="font-semibold">{profile?.display_name || 'User'}</span>
            <svg className="w-5 h-5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent className="w-60 rounded-3xl shadow-2xl border border-gray-200/50 backdrop-blur-sm">
          <div className="p-3">
            <DropdownMenuItem asChild>
              <Link 
                to="/profile" 
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-2xl transition-all duration-300 group/item cursor-pointer"
              >
                <svg className="w-5 h-5 text-gray-400 group-hover/item:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                My Profile
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuItem asChild>
              <Link 
                to="/profile/edit" 
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 rounded-2xl transition-all duration-300 group/item cursor-pointer"
              >
                <svg className="w-5 h-5 text-gray-400 group-hover/item:text-green-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Profile
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link 
                to="/appearance" 
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 rounded-2xl transition-all duration-300 group/item cursor-pointer"
              >
                <svg className="w-5 h-5 text-gray-400 group-hover/item:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
                </svg>
                Appearance
              </Link>
            </DropdownMenuItem>
            
            {!isProfileComplete(profile) && (
              <DropdownMenuItem asChild>
                <Link 
                  to="/profile/edit" 
                  className="flex items-center gap-3 px-4 py-3 text-amber-700 hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 rounded-2xl transition-all duration-300 group/item cursor-pointer"
                >
                  <svg className="w-5 h-5 text-amber-500 group-hover/item:text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Complete Profile
                </Link>
              </DropdownMenuItem>
            )}
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              onClick={signOut}
              className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 rounded-2xl transition-all duration-300 group/item cursor-pointer"
            >
              <svg className="w-5 h-5 text-red-500 group-hover/item:text-pink-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
