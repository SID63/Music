import React, { createContext, useContext, ReactNode } from 'react';
import { apiClient } from '@/lib/api-client';

// Define the ApiClient type based on the apiClient instance
type ApiClient = typeof apiClient;

// Create the context with a default value
const ApiContext = createContext<ApiClient>(apiClient);

type ApiProviderProps = {
  children: ReactNode;
  client?: ApiClient;
};

export function ApiProvider({ children, client = apiClient }: ApiProviderProps) {
  return <ApiContext.Provider value={client}>{children}</ApiContext.Provider>;
}

// Custom hook to use the API client
export function useApiClient() {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error('useApiClient must be used within an ApiProvider');
  }
  return context;
}

// Re-export the API client for convenience
export { apiClient };

// Example of a custom hook that uses the API client
export function useAuth() {
  const api = useApiClient();
  
  const login = async (credentials: { email: string; password: string }) => {
    try {
      const data = await api.login(credentials);
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signup = async (userData: {
    email: string;
    password: string;
    role: 'musician' | 'organizer';
    isBand?: boolean;
  }) => {
    try {
      const data = await api.signup(userData);
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const getCurrentUser = async () => {
    try {
      const data = await api.getCurrentUser();
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  return {
    login,
    signup,
    getCurrentUser,
  };
}

// Example of a custom hook for events
export function useEvents() {
  const api = useApiClient();
  
  const getEvents = async (params?: Record<string, any>) => {
    try {
      const data = await api.getEvents(params);
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const getEvent = async (eventId: string) => {
    try {
      const data = await api.getEvent(eventId);
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const createEvent = async (eventData: any) => {
    try {
      const data = await api.createEvent(eventData);
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  return {
    getEvents,
    getEvent,
    createEvent,
  };
}

// Example of a custom hook for profiles
export function useProfiles() {
  const api = useApiClient();
  
  const getProfile = async (profileId: string) => {
    try {
      const data = await api.getProfile(profileId);
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const updateProfile = async (profileId: string, data: any) => {
    try {
      const updatedProfile = await api.updateProfile(profileId, data);
      return { data: updatedProfile, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  return {
    getProfile,
    updateProfile,
  };
}

// Example of a custom hook for bands
export function useBands() {
  const api = useApiClient();
  
  const getBands = async (params?: Record<string, any>) => {
    try {
      const data = await api.getBands(params);
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const getBand = async (bandId: string) => {
    try {
      const data = await api.getBand(bandId);
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const createBand = async (bandData: any) => {
    try {
      const data = await api.createBand(bandData);
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  return {
    getBands,
    getBand,
    createBand,
  };
}

// Example of a custom hook for applications
export function useApplications() {
  const api = useApiClient();
  
  const applyToEvent = async (eventId: string, applicationData: any) => {
    try {
      const data = await api.applyToEvent(eventId, applicationData);
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const getEventApplications = async (eventId: string) => {
    try {
      const data = await api.getEventApplications(eventId);
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  return {
    applyToEvent,
    getEventApplications,
  };
}

// Example of a custom hook for messages
export function useMessages() {
  const api = useApiClient();
  
  const getConversations = async () => {
    try {
      const data = await api.getConversations();
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const getMessages = async (conversationId: string) => {
    try {
      const data = await api.getMessages(conversationId);
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const sendMessage = async (conversationId: string, content: string) => {
    try {
      const data = await api.sendMessage(conversationId, content);
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  return {
    getConversations,
    getMessages,
    sendMessage,
  };
}

// Example of a custom hook for reviews
export function useReviews() {
  const api = useApiClient();
  
  const createReview = async (reviewData: {
    revieweeId: string;
    rating: number;
    comment: string;
  }) => {
    try {
      const data = await api.createReview(reviewData);
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const getProfileReviews = async (profileId: string) => {
    try {
      const data = await api.getProfileReviews(profileId);
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  return {
    createReview,
    getProfileReviews,
  };
}
