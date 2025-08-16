import { createApiUrl, handleApiResponse, handleApiError } from './api-utils';

export * from './api-utils';

class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = this.baseUrl + endpoint;
    const headers = {
      ...this.defaultHeaders,
      ...(options.headers || {}),
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // For cookies/auth
      });

      return await handleApiResponse<T>(response);
    } catch (error) {
      // Re-throw the error to be handled by the caller
      throw error;
    }
  }

  // Auth methods
  async login(credentials: { email: string; password: string }) {
    return this.request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async signup(userData: {
    email: string;
    password: string;
    role: 'musician' | 'organizer';
    isBand?: boolean;
  }) {
    return this.request<{ user: any; token: string }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getCurrentUser() {
    return this.request<{ user: any }>('/auth/me');
  }

  // Profile methods
  async getProfile(profileId: string) {
    return this.request<Profile>(`/profiles/${profileId}`);
  }

  async updateProfile(profileId: string, data: Partial<Profile>) {
    return this.request<Profile>(`/profiles/${profileId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Event methods
  async getEvents(params?: Record<string, any>) {
    const query = new URLSearchParams(params).toString();
    return this.request<{ events: Event[]; total: number }>(
      `/events${query ? `?${query}` : ''}`
    );
  }

  async getEvent(eventId: string) {
    return this.request<Event>(`/events/${eventId}`);
  }

  async createEvent(eventData: Partial<Event>) {
    return this.request<Event>('/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  async updateEvent(eventId: string, eventData: Partial<Event>) {
    return this.request<Event>(`/events/${eventId}`, {
      method: 'PATCH',
      body: JSON.stringify(eventData),
    });
  }

  async deleteEvent(eventId: string) {
    return this.request<void>(`/events/${eventId}`, {
      method: 'DELETE',
    });
  }

  // Band methods
  async getBands(params?: Record<string, any>) {
    const query = new URLSearchParams(params).toString();
    return this.request<{ bands: Band[]; total: number }>(
      `/bands${query ? `?${query}` : ''}`
    );
  }

  async getBand(bandId: string) {
    return this.request<Band>(`/bands/${bandId}`);
  }

  async createBand(bandData: Partial<Band>) {
    return this.request<Band>('/bands', {
      method: 'POST',
      body: JSON.stringify(bandData),
    });
  }

  // Application methods
  async applyToEvent(eventId: string, applicationData: any) {
    return this.request<Application>(`/events/${eventId}/applications`, {
      method: 'POST',
      body: JSON.stringify(applicationData),
    });
  }

  async getEventApplications(eventId: string) {
    return this.request<Application[]>(`/events/${eventId}/applications`);
  }

  // Message methods
  async getConversations() {
    return this.request<Conversation[]>('/messages/conversations');
  }

  async getMessages(conversationId: string) {
    return this.request<Message[]>(`/messages/${conversationId}`);
  }

  async sendMessage(conversationId: string, content: string) {
    return this.request<Message>(`/messages/${conversationId}`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  // Review methods
  async createReview(reviewData: {
    revieweeId: string;
    rating: number;
    comment: string;
  }) {
    return this.request<Review>('/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  }

  async getProfileReviews(profileId: string) {
    return this.request<Review[]>(`/profiles/${profileId}/reviews`);
  }
}

// Types
type Profile = {
  id: string;
  userId: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  location?: string;
  genres: string[];
  instruments: string[];
  isBand: boolean;
  bandMembers?: Array<{
    id: string;
    name: string;
    role: string;
  }>;
  socialLinks?: {
    website?: string;
    youtube?: string;
    soundcloud?: string;
    spotify?: string;
  };
  createdAt: string;
  updatedAt: string;
};

type Event = {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  location: string;
  address?: string;
  city: string;
  country: string;
  genres: string[];
  imageUrl?: string;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  organizerId: string;
  price?: number;
  capacity?: number;
  applicationDeadline?: string;
  createdAt: string;
  updatedAt: string;
};

type Band = {
  id: string;
  name: string;
  description: string;
  genres: string[];
  location: string;
  avatarUrl?: string;
  coverImageUrl?: string;
  members: Array<{
    userId: string;
    name: string;
    role: string;
    joinedAt: string;
  }>;
  socialLinks?: {
    website?: string;
    youtube?: string;
    soundcloud?: string;
    spotify?: string;
  };
  createdAt: string;
  updatedAt: string;
};

type Application = {
  id: string;
  eventId: string;
  applicantId: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  createdAt: string;
  updatedAt: string;
};

type Conversation = {
  id: string;
  participants: Array<{
    id: string;
    name: string;
    avatarUrl?: string;
  }>;
  lastMessage?: {
    content: string;
    sentAt: string;
    isRead: boolean;
  };
  unreadCount: number;
  updatedAt: string;
};

type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
};

type Review = {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar?: string;
  revieweeId: string;
  rating: number;
  comment: string;
  createdAt: string;
};

// Create a singleton instance
export const apiClient = new ApiClient(import.meta.env.VITE_API_BASE_URL || '/api');

export default apiClient;
