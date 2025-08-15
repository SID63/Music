import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { logProfileCreationAttempt } from '../utils/debugUtils';

export type Profile = {
  id: string;
  user_id: string;
  role: 'musician' | 'organizer';
  display_name: string | null;
  is_band: boolean | null;
  genres: string[] | null;
  location: string | null;
  price_min: number | null;
  price_max: number | null;
  youtube_url: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
};

type AuthContextValue = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ data?: any; error?: string }>;
  signUp: (
    email: string,
    password: string,
    role: 'musician' | 'organizer',
    isBand?: boolean,
  ) => Promise<{ data?: any; error?: string }>;
  signOut: () => Promise<void>;
  createProfile: (role: 'musician' | 'organizer', isBand?: boolean) => Promise<{ data?: Profile; error?: string }>;
  refreshProfile: (userToRefresh?: User) => Promise<void>;
  clearInvalidTokens: () => void;
  isProfileComplete: (profile: any) => boolean;
  getDefaultRedirectPath: () => string;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to clear invalid tokens
  const clearInvalidTokens = () => {
    localStorage.removeItem('sb-qmnspcgfhxnzhzoxxzkx-auth-token');
    sessionStorage.removeItem('sb-qmnspcgfhxnzhzoxxzkx-auth-token');
    setUser(null);
    setProfile(null);
  };

  // Function to clear stale pending profile data
  const clearStalePendingData = () => {
    const pendingData = localStorage.getItem('pendingProfileData');
    if (pendingData) {
      try {
        const { timestamp } = JSON.parse(pendingData);
        // Clear if older than 24 hours
        if (timestamp && Date.now() - timestamp > 24 * 60 * 60 * 1000) {
          localStorage.removeItem('pendingProfileData');
        }
      } catch (error) {
        // If parsing fails, clear the data
        localStorage.removeItem('pendingProfileData');
      }
    }
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const init = async () => {
      try {
        // Clear stale pending profile data
        clearStalePendingData();
        
        // Add a timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          console.warn('Auth initialization timeout - clearing tokens and continuing');
          clearInvalidTokens();
          setLoading(false);
        }, 5000); // 5 second timeout

        const { data, error } = await supabase.auth.getSession();
        
        // Clear timeout if we get a response
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        if (error) {
          console.error('Session error:', error);
          // If there's a refresh token error, clear the tokens
          if (error.message.includes('Invalid Refresh Token') || error.message.includes('Refresh Token Not Found')) {
            clearInvalidTokens();
          }
          setLoading(false);
          return;
        }
        
        setUser(data.session?.user ?? null);
        setLoading(false);
      } catch (error) {
        console.error('Auth initialization error:', error);
        clearInvalidTokens();
        setLoading(false);
      }
    };
    
    init();

    // Cleanup function to clear timeout if component unmounts
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state change:', event, newSession?.user?.id);
        
        if (event === 'SIGNED_IN' && newSession) {
          setUser(newSession.user);
          setLoading(false); // Stop loading when user signs in
          await refreshProfile(newSession.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED' && newSession) {
          setUser(newSession.user);
          setLoading(false);
        } else if (event === 'TOKEN_REFRESH_FAILED' as any) {
          console.log('Token refresh failed, clearing tokens');
          clearInvalidTokens();
        } else if (event === 'INITIAL_SESSION' && newSession) {
          // Handle initial session event
          setUser(newSession.user);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    
    refreshProfile(user);
  }, [user]);

  const refreshProfile = async (userToRefresh = user) => {
    if (!userToRefresh) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userToRefresh.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found
          setProfile(null);
        } else {
          console.error('Profile query error:', error);
        }
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  const createProfile = async (role: 'musician' | 'organizer', isBand: boolean = false) => {
    if (!user) return { error: 'No user' };

    try {
      // Check if profile already exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (existingProfile) {
        // Profile already exists, return it instead of error
        setProfile(existingProfile);
        return { data: existingProfile };
      }

      // If no profile found and it's not a "not found" error, handle it
      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      logProfileCreationAttempt(user.id, role, isBand);
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          role,
          is_band: isBand,
        })
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      return { data };
    } catch (error) {
      console.error('Profile creation error:', error);
      return { error: error.message };
    }
  };

  const signUp = async (email: string, password: string, role: 'musician' | 'organizer', isBand: boolean = false) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            isBand,
          }
        }
      });

      if (error) throw error;

      // Store signup data for profile creation after email verification
      localStorage.setItem('pendingProfileData', JSON.stringify({ 
        role, 
        isBand, 
        timestamp: Date.now() 
      }));
      
      return { data };
    } catch (error) {
      console.error('Signup error:', error);
      return { error: (error as Error).message };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if we have pending profile data and user is verified
      if (data.user && data.user.email_confirmed_at) {
        const pendingData = localStorage.getItem('pendingProfileData');
        if (pendingData) {
          const { role, isBand, timestamp } = JSON.parse(pendingData);
          
          // Check if pending data is not too old (24 hours)
          if (timestamp && Date.now() - timestamp > 24 * 60 * 60 * 1000) {
            localStorage.removeItem('pendingProfileData');
            return { data };
          }
          
          try {
            // First check if profile already exists
            const { data: existingProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', data.user.id)
              .single();

            if (existingProfile) {
              // Profile already exists, just set it and clear pending data
              setProfile(existingProfile);
              localStorage.removeItem('pendingProfileData');
            } else {
              // Create new profile
              logProfileCreationAttempt(data.user.id, role, isBand);
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .insert({
                  user_id: data.user.id,
                  role,
                  is_band: isBand,
                })
                .select()
                .single();

              if (profileError) throw profileError;

              setProfile(profileData);
              localStorage.removeItem('pendingProfileData');
            }
          } catch (profileError) {
            console.error('Profile creation error after verification:', profileError);
            // If there's an error, still try to fetch existing profile
            try {
              const { data: existingProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', data.user.id)
                .single();
              
              if (existingProfile) {
                setProfile(existingProfile);
                localStorage.removeItem('pendingProfileData');
              }
            } catch (fetchError) {
              console.error('Error fetching existing profile:', fetchError);
            }
          }
        }
      }

      // After successful sign in, the DefaultRedirect component will handle the redirect

      return { data };
    } catch (error) {
      console.error('Signin error:', error);
      return { error: (error as Error).message };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear local state
      setUser(null);
      setProfile(null);
      
      // Clear any stored data
      localStorage.removeItem('pendingProfileData');
      
      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Signout error:', error);
    }
  };

  // Check if profile is complete
  const isProfileComplete = useCallback((profile: any): boolean => {
    if (!profile) return false;
    
    // Basic required fields
    if (!profile.display_name || !profile.location || !profile.bio) {
      return false;
    }

    // Musician-specific required fields
    if (profile.role === 'musician') {
      if (!profile.genres || profile.genres.length === 0) {
        return false;
      }
      if (!profile.price_min) {
        return false;
      }
    }

    return true;
  }, []);

  // Get default redirect path based on user role and profile completion
  const getDefaultRedirectPath = useCallback((): string => {
    if (!profile) return '/';
    
    if (!isProfileComplete(profile)) {
      return '/setup';
    }
    
    // Complete profiles get redirected based on role
    if (profile.role === 'musician') {
      return '/events'; // Musicians see events by default
    } else if (profile.role === 'organizer') {
      return '/musicians'; // Organizers see musicians by default
    }
    
    return '/';
  }, [profile, isProfileComplete]);

  // Check for pending profile data on mount
  useEffect(() => {
    if (user && !profile) {
      const pendingData = localStorage.getItem('pendingProfileData');
      if (pendingData) {
        const { role, isBand } = JSON.parse(pendingData);
        
        createProfile(role, isBand).then(({ data }) => {
          if (data) {
            localStorage.removeItem('pendingProfileData');
          }
        });
      }
    }
  }, [user, profile]);

  const value = {
    user,
    profile,
    loading,
    createProfile,
    refreshProfile,
    signUp,
    signIn,
    signOut,
    clearInvalidTokens,
    isProfileComplete,
    getDefaultRedirectPath,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


