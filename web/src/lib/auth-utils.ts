import { toast } from '@/components/ui/use-toast';
import { ApiError } from './api-utils';

// Auth token storage keys
const AUTH_TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_DATA_KEY = 'user_data';

/**
 * Saves authentication tokens to local storage
 */
export function saveAuthTokens({
  accessToken,
  refreshToken,
}: {
  accessToken: string;
  refreshToken: string;
}): void {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } catch (error) {
    console.error('Error saving auth tokens:', error);
  }
}

/**
 * Retrieves the authentication token from local storage
 */
export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

/**
 * Retrieves the refresh token from local storage
 */
export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting refresh token:', error);
    return null;
  }
}

/**
 * Removes authentication tokens from local storage
 */
export function clearAuthTokens(): void {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
  } catch (error) {
    console.error('Error clearing auth tokens:', error);
  }
}

/**
 * Saves user data to local storage
 */
export function saveUserData(userData: any): void {
  try {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
  } catch (error) {
    console.error('Error saving user data:', error);
  }
}

/**
 * Retrieves user data from local storage
 */
export function getUserData<T = any>(): T | null {
  try {
    const userData = localStorage.getItem(USER_DATA_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
}

/**
 * Checks if the user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

/**
 * Handles authentication errors and shows appropriate toast messages
 */
export function handleAuthError(error: unknown, defaultMessage = 'Authentication failed'): void {
  let message = defaultMessage;
  let isAuthError = false;

  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        message = 'Your session has expired. Please log in again.';
        isAuthError = true;
        clearAuthTokens();
        // Redirect to login page if we're not already there
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        break;
      case 403:
        message = 'You do not have permission to perform this action.';
        break;
      case 404:
        message = 'The requested resource was not found.';
        break;
      case 422:
        message = 'Validation error. Please check your input.';
        break;
      case 429:
        message = 'Too many requests. Please try again later.';
        break;
      case 500:
        message = 'An unexpected error occurred. Please try again later.';
        break;
      default:
        message = error.message || defaultMessage;
    }
  } else if (error instanceof Error) {
    message = error.message || defaultMessage;
  }

  // Only show toast if it's not an auth error (to avoid duplicate messages)
  if (!isAuthError) {
    toast({
      title: 'Error',
      description: message,
      variant: 'destructive',
    });
  }

  console.error('Auth error:', error);
}

/**
 * Handles successful login
 */
export function handleSuccessfulLogin({
  accessToken,
  refreshToken,
  user,
  redirectPath = '/dashboard',
}: {
  accessToken: string;
  refreshToken: string;
  user: any;
  redirectPath?: string;
}): void {
  // Save tokens and user data
  saveAuthTokens({ accessToken, refreshToken });
  saveUserData(user);

  // Show success message
  toast({
    title: 'Welcome back!',
    description: 'You have successfully logged in.',
  });

  // Redirect to dashboard or specified path
  window.location.href = redirectPath;
}

/**
 * Handles logout
 */
export function handleLogout(redirectPath = '/login'): void {
  // Clear auth data
  clearAuthTokens();

  // Show success message
  toast({
    title: 'Logged out',
    description: 'You have been successfully logged out.',
  });

  // Redirect to login page
  window.location.href = redirectPath;
}

/**
 * Checks if the current user has a specific role
 */
export function hasRole(requiredRole: string): boolean {
  const user = getUserData();
  if (!user) return false;
  
  // Handle both array and single role
  const userRoles = Array.isArray(user.roles) ? user.roles : [user.roles];
  return userRoles.includes(requiredRole);
}

/**
 * Checks if the current user has any of the specified roles
 */
export function hasAnyRole(requiredRoles: string[]): boolean {
  const user = getUserData();
  if (!user) return false;
  
  // Handle both array and single role
  const userRoles = Array.isArray(user.roles) ? user.roles : [user.roles];
  return requiredRoles.some(role => userRoles.includes(role));
}

/**
 * Checks if the current user has all of the specified roles
 */
export function hasAllRoles(requiredRoles: string[]): boolean {
  const user = getUserData();
  if (!user) return false;
  
  // Handle both array and single role
  const userRoles = Array.isArray(user.roles) ? user.roles : [user.roles];
  return requiredRoles.every(role => userRoles.includes(role));
}

/**
 * Gets the authentication headers for API requests
 */
export function getAuthHeaders(additionalHeaders: Record<string, string> = {}): HeadersInit {
  const token = getAuthToken();
  
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...additionalHeaders,
  };
}

/**
 * Refreshes the authentication token
 */
export async function refreshAuthToken(): Promise<{ accessToken: string; refreshToken: string } | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    
    // Save the new tokens
    saveAuthTokens({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });

    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    };
  } catch (error) {
    console.error('Error refreshing token:', error);
    clearAuthTokens();
    return null;
  }
}

/**
 * Wrapper for fetch that handles authentication and token refresh
 */
export async function authFetch(
  input: RequestInfo,
  init?: RequestInit
): Promise<Response> {
  let response = await fetch(input, {
    ...init,
    headers: {
      ...getAuthHeaders(),
      ...init?.headers,
    },
  });

  // If unauthorized, try to refresh the token and retry
  if (response.status === 401) {
    const newTokens = await refreshAuthToken();
    
    if (newTokens) {
      // Retry the request with the new token
      response = await fetch(input, {
        ...init,
        headers: {
          ...getAuthHeaders(),
          ...init?.headers,
          'Authorization': `Bearer ${newTokens.accessToken}`,
        },
      });
    } else {
      // If refresh fails, clear auth and redirect to login
      clearAuthTokens();
      window.location.href = '/login';
      throw new Error('Session expired. Please log in again.');
    }
  }

  return response;
}
