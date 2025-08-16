import { useState, useCallback, useEffect } from 'react';
import { handleApiError, handleApiResponse } from '@/lib/api-utils';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type UseApiOptions<T> = {
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
  successMessage?: string;
  errorMessage?: string;
};

type UseApiResult<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  fetchData: (url: string, options?: RequestInit) => Promise<T | null>;
  reset: () => void;
};

export function useApi<T = any>({
  onSuccess,
  onError,
  successMessage,
  errorMessage: defaultErrorMessage = 'An error occurred',
}: UseApiOptions<T> = {}): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async (url: string, options: RequestInit = {}) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });

        const result = await handleApiResponse<T>(response);
        setData(result);

        if (successMessage) {
          // Use the toast from use-toast if needed
          console.log(successMessage);
        }

        if (onSuccess) {
          onSuccess(result);
        }

        return result;
      } catch (err) {
        const apiError = await handleApiError(err, defaultErrorMessage);
        setError(apiError.message);

        if (onError) {
          onError(apiError);
        }

        return null;
      } finally {
        setLoading(false);
      }
    },
    [onSuccess, onError, successMessage, defaultErrorMessage]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, fetchData, reset };
}

type UseMutationOptions<T, V = any> = UseApiOptions<T> & {
  method?: HttpMethod;
  onMutate?: (variables: V) => void | Promise<void>;
};

type UseMutationResult<T, V> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  mutate: (variables: V, options?: RequestInit) => Promise<T | null>;
  reset: () => void;
};

export function useMutation<T = any, V = any>(
  url: string,
  options: UseMutationOptions<T, V> = {}
): UseMutationResult<T, V> {
  const { method = 'POST', onMutate, ...restOptions } = options;
  const { data, loading, error, fetchData, reset } = useApi<T>(restOptions);

  const mutate = useCallback(
    async (variables: V, requestOptions: RequestInit = {}) => {
      if (onMutate) {
        await onMutate(variables);
      }

      return fetchData(url, {
        ...requestOptions,
        method,
        body: method !== 'GET' ? JSON.stringify(variables) : undefined,
      });
    },
    [url, method, fetchData, onMutate]
  );

  return { data, loading, error, mutate, reset };
}

type UseQueryOptions<T> = Omit<UseApiOptions<T>, 'onSuccess' | 'onError'> & {
  enabled?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
};

type UseQueryResult<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: (params?: Record<string, string | number>) => Promise<void>;
};

export function useQuery<T = any>(
  url: string,
  params: Record<string, string | number> = {},
  options: UseQueryOptions<T> = {}
): UseQueryResult<T> {
  const { enabled = true, onSuccess, onError, ...restOptions } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!!enabled);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async (queryParams = params) => {
      if (!enabled) return;

      setLoading(true);
      setError(null);

      try {
        const queryString = new URLSearchParams(
          Object.entries(queryParams).reduce((acc, [key, value]) => {
            if (value !== undefined && value !== null) {
              acc[key] = String(value);
            }
            return acc;
          }, {} as Record<string, string>)
        ).toString();

        const fullUrl = queryString ? `${url}?${queryString}` : url;
        const response = await fetch(fullUrl);
        const result = await handleApiResponse<T>(response);
        
        setData(result);
        
        if (restOptions.successMessage) {
          console.log(restOptions.successMessage);
        }
        
        if (onSuccess) {
          onSuccess(result);
        }
      } catch (err) {
        const apiError = await handleApiError(err, restOptions.errorMessage);
        setError(apiError.message);
        
        if (onError) {
          onError(apiError);
        }
      } finally {
        setLoading(false);
      }
    },
    [url, enabled, params, onSuccess, onError, restOptions]
  );

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [enabled, fetchData]);

  const refetch = useCallback(
    async (newParams = {}) => {
      return fetchData({ ...params, ...newParams });
    },
    [fetchData, params]
  );

  return { data, loading, error, refetch };
}
