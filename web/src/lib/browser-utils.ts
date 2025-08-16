/**
 * Type definitions for browser utilities
 */
type StorageType = 'local' | 'session';

/**
 * Browser storage utilities
 */

/**
 * Sets an item in the specified storage
 * @param key - The key to set
 * @param value - The value to store
 * @param type - The type of storage ('local' or 'session')
 */
export function setStorageItem<T>(
  key: string,
  value: T,
  type: StorageType = 'local'
): void {
  try {
    const storage = type === 'local' ? localStorage : sessionStorage;
    const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
    storage.setItem(key, serializedValue);
  } catch (error) {
    console.error(`Error setting ${type}Storage key "${key}":`, error);
  }
}

/**
 * Gets an item from the specified storage
 * @param key - The key to get
 * @param type - The type of storage ('local' or 'session')
 * @returns The stored value or null if not found
 */
export function getStorageItem<T>(
  key: string,
  type: StorageType = 'local'
): T | null {
  try {
    const storage = type === 'local' ? localStorage : sessionStorage;
    const item = storage.getItem(key);
    if (item === null) return null;
    
    try {
      return JSON.parse(item) as T;
    } catch (e) {
      return item as unknown as T;
    }
  } catch (error) {
    console.error(`Error getting ${type}Storage key "${key}":`, error);
    return null;
  }
}

/**
 * Removes an item from the specified storage
 * @param key - The key to remove
 * @param type - The type of storage ('local' or 'session')
 */
export function removeStorageItem(
  key: string,
  type: StorageType = 'local'
): void {
  try {
    const storage = type === 'local' ? localStorage : sessionStorage;
    storage.removeItem(key);
  } catch (error) {
    console.error(`Error removing ${type}Storage key "${key}":`, error);
  }
}

/**
 * URL utilities
 */

/**
 * Gets a URL parameter by name
 * @param name - The parameter name
 * @returns The parameter value or null if not found
 */
export function getUrlParam(name: string): string | null {
  if (typeof window === 'undefined') return null;
  
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

/**
 * Gets all URL parameters as an object
 * @returns An object with parameter names as keys and values
 */
export function getAllUrlParams(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  
  const urlParams = new URLSearchParams(window.location.search);
  const params: Record<string, string> = {};
  
  for (const [key, value] of urlParams.entries()) {
    params[key] = value;
  }
  
  return params;
}

/**
 * Updates the URL parameters without reloading the page
 * @param params - An object with parameter names and values
 * @param replace - Whether to replace the current history entry
 */
export function updateUrlParams(
  params: Record<string, string | number | boolean | null>,
  replace: boolean = false
): void {
  if (typeof window === 'undefined') return;
  
  const url = new URL(window.location.href);
  const searchParams = new URLSearchParams(url.search);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value === null) {
      searchParams.delete(key);
    } else {
      searchParams.set(key, String(value));
    }
  });
  
  const newUrl = `${url.pathname}?${searchParams.toString()}`;
  
  if (replace) {
    window.history.replaceState({}, '', newUrl);
  } else {
    window.history.pushState({}, '', newUrl);
  }
}

/**
 * Browser information
 */

export const browser = {
  /**
   * Checks if the current device is a mobile device
   * @returns True if the device is a mobile device
   */
  isMobile(): boolean {
    if (typeof window === 'undefined' || !window.navigator) return false;
    
    const userAgent = window.navigator.userAgent.toLowerCase();
    const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/;
    
    return mobileRegex.test(userAgent);
  },
  
  /**
   * Checks if the current device is a touch device
   * @returns True if the device supports touch events
   */
  isTouchDevice(): boolean {
    if (typeof window === 'undefined') return false;
    
    return (
      'ontouchstart' in window ||
      (window as any).DocumentTouch && document instanceof (window as any).DocumentTouch ||
      navigator.maxTouchPoints > 0 ||
      (window as any).msMaxTouchPoints > 0
    );
  },
  
  /**
   * Gets the current viewport dimensions
   * @returns An object with width and height of the viewport
   */
  getViewportSize(): { width: number; height: number } {
    if (typeof window === 'undefined') return { width: 0, height: 0 };
    
    return {
      width: window.innerWidth || document.documentElement.clientWidth || 0,
      height: window.innerHeight || document.documentElement.clientHeight || 0
    };
  },
  
  /**
   * Gets the current scroll position
   * @returns An object with x and y scroll positions
   */
  getScrollPosition(): { x: number; y: number } {
    if (typeof window === 'undefined') return { x: 0, y: 0 };
    
    return {
      x: window.pageXOffset || document.documentElement.scrollLeft || 0,
      y: window.pageYOffset || document.documentElement.scrollTop || 0
    };
  },
  
  /**
   * Scrolls to an element with a smooth animation
   * @param selector - The CSS selector of the element to scroll to
   * @param offset - Optional offset from the top of the element
   */
  scrollToElement(selector: string, offset: number = 0): void {
    if (typeof document === 'undefined') return;
    
    const element = document.querySelector(selector);
    if (!element) return;
    
    const elementRect = element.getBoundingClientRect();
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const top = elementRect.top + scrollY - offset;
    
    window.scrollTo({
      top,
      left: 0,
      behavior: 'smooth'
    });
  }
};

/**
 * Clipboard utilities
 */

export const clipboard = {
  /**
   * Copies text to the clipboard
   * @param text - The text to copy
   * @returns A promise that resolves when the text is copied
   */
  async copyText(text: string): Promise<boolean> {
    if (!navigator.clipboard) {
      return this._fallbackCopyText(text);
    }
    
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Failed to copy text: ', err);
      return this._fallbackCopyText(text);
    }
  },
  
  /**
   * Fallback method for copying text to the clipboard
   */
  _fallbackCopyText(text: string): boolean {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '0';
      textarea.style.top = '0';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      
      return successful;
    } catch (err) {
      console.error('Fallback copy failed: ', err);
      return false;
    }
  },
  
  /**
   * Reads text from the clipboard
   * @returns A promise that resolves with the clipboard text
   */
  async readText(): Promise<string> {
    if (!navigator.clipboard) {
      throw new Error('Clipboard API not supported');
    }
    
    try {
      return await navigator.clipboard.readText();
    } catch (err) {
      console.error('Failed to read from clipboard: ', err);
      throw err;
    }
  }
};

/**
 * Device information
 */

export const device = {
  /**
   * Gets the device pixel ratio
   */
  getPixelRatio(): number {
    if (typeof window === 'undefined') return 1;
    return window.devicePixelRatio || 1;
  },
  
  /**
   * Gets the device orientation
   */
  getOrientation(): 'portrait' | 'landscape' {
    if (typeof window === 'undefined') return 'portrait';
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
  },
  
  /**
   * Gets the device type (mobile, tablet, or desktop)
   */
  getType(): 'mobile' | 'tablet' | 'desktop' {
    if (typeof window === 'undefined') return 'desktop';
    
    const width = window.innerWidth;
    
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  },
  
  /**
   * Gets the operating system name
   */
  getOS(): string {
    if (typeof navigator === 'undefined') return 'unknown';
    
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    
    if (/windows phone/i.test(userAgent)) return 'Windows Phone';
    if (/android/i.test(userAgent)) return 'Android';
    if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) return 'iOS';
    if (/windows/i.test(userAgent)) return 'Windows';
    if (/mac/i.test(userAgent)) return 'macOS';
    if (/linux/i.test(userAgent)) return 'Linux';
    
    return 'unknown';
  }
};

/**
 * Performance monitoring
 */

export const perf = {
  /**
   * Measures the time it takes to execute a function
   * @param fn - The function to measure
   * @param label - Optional label for the measurement
   * @returns The result of the function
   */
  measure<T>(fn: () => T, label: string = 'default'): T {
    if (typeof performance === 'undefined') return fn();
    
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    
    console.log(`[${label}] Execution time: ${(end - start).toFixed(2)}ms`);
    return result;
  },
  
  /**
   * Measures the time it takes to execute an async function
   * @param fn - The async function to measure
   * @param label - Optional label for the measurement
   * @returns A promise that resolves to the result of the function
   */
  async measureAsync<T>(
    fn: () => Promise<T>,
    label: string = 'default'
  ): Promise<T> {
    if (typeof performance === 'undefined') return fn();
    
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    
    console.log(`[${label}] Execution time: ${(end - start).toFixed(2)}ms`);
    return result;
  }
};

/**
 * Network utilities
 */

export const network = {
  /**
   * Checks if the device is currently online
   */
  isOnline(): boolean {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
  },
  
  /**
   * Gets the effective connection type
   */
  getConnectionType(): string {
    if (typeof (navigator as any).connection === 'undefined') {
      return 'unknown';
    }
    
    const connection = (navigator as any).connection;
    return connection.effectiveType || 'unknown';
  },
  
  /**
   * Gets the connection downlink speed in Mbps
   */
  getDownlinkSpeed(): number {
    if (typeof (navigator as any).connection === 'undefined') {
      return 0;
    }
    
    const connection = (navigator as any).connection;
    return connection.downlink || 0;
  },
  
  /**
   * Gets the round-trip time (RTT) in milliseconds
   */
  getRTT(): number {
    if (typeof (navigator as any).connection === 'undefined') {
      return 0;
    }
    
    const connection = (navigator as any).connection;
    return connection.rtt || 0;
  }
};
