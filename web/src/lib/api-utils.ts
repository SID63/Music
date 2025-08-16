import { toast } from '@/components/ui/use-toast';

export class ApiError extends Error {
  status?: number;
  details?: any;
  constructor({ message, status, details }: { message: string; status?: number; details?: any }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export async function handleApiError(error: unknown, defaultMessage = 'An error occurred'): Promise<{ message: string; status?: number }> {
  console.error('API Error:', error);
  
  let errorMessage = defaultMessage;
  let status: number | undefined;
  
  if (error instanceof ApiError) {
    errorMessage = error.message || defaultMessage;
    status = error.status;
  } else if (error instanceof Error) {
    errorMessage = error.message || defaultMessage;
    
    // Handle network errors
    if (error.message.includes('Failed to fetch')) {
      errorMessage = 'Unable to connect to the server. Please check your internet connection.';
    }
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else if (error && typeof error === 'object' && 'message' in error) {
    errorMessage = String((error as any).message);
    status = (error as any).status;
  }
  
  // Show toast notification
  toast({
    title: 'Error',
    description: errorMessage,
    variant: 'destructive',
  });
  
  return { message: errorMessage, status };
}

export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      throw new ApiError({ message: response.statusText, status: response.status });
    }
    throw new ApiError({ message: errorData?.message || 'Request failed', status: response.status, details: errorData });
  }
  
  // For 204 No Content responses
  if (response.status === 204) {
    return undefined as unknown as T;
  }
  
  return response.json();
}

// Helper function to create API URLs
export function createApiUrl(path: string, params: Record<string, string | number> = {}): string {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  const url = new URL(path, baseUrl);
  
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, String(value));
  });
  
  return url.toString();
}
