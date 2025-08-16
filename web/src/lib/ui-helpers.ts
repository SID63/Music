import { cn } from "@/lib/utils";
import { type ClassValue } from "class-variance-authority/types";
import * as React from "react";
import { ReactNode, useEffect, useRef, useState } from "react";
import { toast } from "@/components/ui/use-toast";

/**
 * Custom hook to handle click outside of an element
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  handler: (event: MouseEvent | TouchEvent) => void
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      // Do nothing if clicking ref's element or descendent elements
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);

  return ref;
}

/**
 * Custom hook to handle keyboard shortcuts
 */
export function useKeyPress(
  targetKey: string,
  handler: (event: KeyboardEvent) => void,
  options: {
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
    preventDefault?: boolean;
    stopPropagation?: boolean;
  } = {}
) {
  const {
    ctrlKey = false,
    shiftKey = false,
    altKey = false,
    metaKey = false,
    preventDefault = true,
    stopPropagation = true,
  } = options;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === targetKey &&
        event.ctrlKey === ctrlKey &&
        event.shiftKey === shiftKey &&
        event.altKey === altKey &&
        event.metaKey === metaKey
      ) {
        if (preventDefault) {
          event.preventDefault();
        }
        if (stopPropagation) {
          event.stopPropagation();
        }
        handler(event);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [targetKey, handler, ctrlKey, shiftKey, altKey, metaKey, preventDefault, stopPropagation]);
}

/**
 * Custom hook to handle infinite scrolling
 */
export function useInfiniteScroll<T>(
  fetchMore: () => Promise<T[]>,
  initialData: T[] = [],
  options: {
    threshold?: number;
    rootMargin?: string;
    enabled?: boolean;
  } = {}
) {
  const { threshold = 0.8, rootMargin = "0px", enabled = true } = options;
  const [items, setItems] = useState<T[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const loadMore = async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setError(null);

    try {
      const newItems = await fetchMore();
      setItems((prev) => [...prev, ...newItems]);
      setHasMore(newItems.length > 0);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load more items"));
      console.error("Error loading more items:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!enabled) return;

    const handleObserver = (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && !isLoading) {
        loadMore();
      }
    };

    observer.current = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin,
      threshold,
    });

    if (loadMoreRef.current) {
      observer.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [enabled, isLoading, hasMore, rootMargin, threshold]);

  return { items, isLoading, hasMore, error, loadMoreRef, loadMore };
}

/**
 * Custom hook to handle form submission with loading and error states
 */
export function useFormSubmit<T>(
  submitFn: (data: T) => Promise<void>,
  options: {
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    successMessage?: string;
    errorMessage?: string;
  } = {}
) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleSubmit = async (data: T) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await submitFn(data);
      if (options.onSuccess) {
        options.onSuccess(data);
      }
      if (options.successMessage) {
        toast({
          title: "Success",
          description: options.successMessage,
          variant: "default",
        });
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(options.errorMessage || "An error occurred");
      setError(error);
      
      if (options.onError) {
        options.onError(error);
      }
      
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      
      // Re-throw the error for form-level error handling
      const status = (error as any)?.status;
      if (typeof status !== 'number' || status >= 500) {
        throw error;
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return { handleSubmit, isSubmitting, error };
}

/**
 * Custom hook to handle copy to clipboard with feedback
 */
export function useCopyToClipboard() {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, 2000);
      
      return true;
    } catch (err) {
      console.error("Failed to copy text:", err);
      setCopied(false);
      return false;
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { copyToClipboard, copied };
}

/**
 * Higher-order component to add a loading state to a component
 */
export function withLoading<T>(
  Component: React.ComponentType<T>,
  LoadingComponent: React.ComponentType = () => React.createElement('div', null, 'Loading...')
) {
  return function WithLoadingComponent({
    isLoading,
    ...props
  }: T & { isLoading?: boolean }) {
    if (isLoading) {
      return React.createElement(LoadingComponent, null);
    }
    return React.createElement(Component as any, props as any);
  };
}

/**
 * Utility to create a context with a hook and provider
 */
export function createContext<T>(
  displayName: string,
  defaultValue: T
): [
  React.Context<T>,
  () => T,
  React.FC<{ value: T; children: React.ReactNode }>
] {
  const Context = React.createContext<T>(defaultValue);
  Context.displayName = displayName;

  const useCtx = () => {
    const context = React.useContext(Context);
    if (context === undefined) {
      throw new Error(`use${displayName} must be used within a ${displayName}Provider`);
    }
    return context;
  };

  const Provider: React.FC<{ value: T; children: React.ReactNode }> = ({
    value,
    children,
  }) => {
    return React.createElement(Context.Provider, { value }, children as any);
  };

  return [Context, useCtx, Provider];
}

/**
 * Utility to create a memoized component with display name
 */
export function createMemoComponent<T>(
  Component: React.ComponentType<T>,
  displayName?: string
) {
  const MemoizedComponent = React.memo(Component) as React.NamedExoticComponent<T>;
  if (displayName) {
    MemoizedComponent.displayName = displayName;
  }
  return MemoizedComponent;
}

/**
 * Utility to create a forward ref component with display name
 */
export function createForwardRef<T, P = {}>(
  render: (props: P, ref: React.Ref<T>) => React.ReactElement | null,
  displayName?: string
) {
  const ForwardRefComponent = React.forwardRef<T, P>(render as any);
  
  if (displayName) {
    ForwardRefComponent.displayName = displayName;
  }
  
  return ForwardRefComponent;
}

/**
 * Utility to create a compound component
 */
export function createCompoundComponent<BaseProps, SubComponents extends Record<string, any>>(
  baseComponent: React.FC<BaseProps>,
  subComponents: SubComponents
) {
  const Component = baseComponent as React.FC<BaseProps> & SubComponents;
  
  Object.entries(subComponents).forEach(([key, value]) => {
    (Component as any)[key] = value;
  });
  
  return Component;
}

/**
 * Utility to create a controlled component
 */
export function createControlledComponent<T, P>(
  Component: React.ComponentType<P & { value: T; onChange: (value: T) => void }>,
  defaultValue: T
) {
  const ControlledComponent: React.FC<Omit<P, 'value' | 'onChange'> & {
    value?: T;
    onChange?: (value: T) => void;
    defaultValue?: T;
  }> = ({
    value: propValue,
    onChange: propOnChange,
    defaultValue: propDefaultValue,
    ...props
  }) => {
    const isControlled = propValue !== undefined;
    const [internalValue, setInternalValue] = useState<T>(
      propDefaultValue !== undefined ? propDefaultValue : defaultValue
    );
    
    const value = isControlled ? propValue! : internalValue;
    
    const handleChange = (newValue: T) => {
      if (!isControlled) {
        setInternalValue(newValue);
      }
      
      if (propOnChange) {
        propOnChange(newValue);
      }
    };
    
    return React.createElement(Component as any, { ...(props as P), value, onChange: handleChange } as any);
  };
  
  return ControlledComponent;
}

/**
 * Utility to create a context provider with a hook
 */
export function createProvider<T>(
  useHook: (props: any) => T,
  displayName: string
) {
  const Context = React.createContext<T | null>(null);
  Context.displayName = displayName;
  
  const Provider: React.FC<{ children: React.ReactNode } & Partial<T>> = ({
    children,
    ...props
  }) => {
    const value = useHook(props);
    return React.createElement(Context.Provider, { value }, children as any);
  };
  
  const useProvider = () => {
    const context = React.useContext(Context);
    if (context === null) {
      throw new Error(`use${displayName} must be used within a ${displayName}Provider`);
    }
    return context;
  };
  
  return [Provider, useProvider] as const;
}
