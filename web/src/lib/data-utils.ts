import { format, parseISO, isBefore, isAfter, addDays, subDays } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';

type Timezone = string;

/**
 * Formats a date string into a human-readable format
 * @param dateString - ISO date string
 * @param formatStr - Date format string (default: 'MMM d, yyyy')
 * @param timezone - Timezone string (default: user's local timezone)
 * @returns Formatted date string
 */
export function formatDate(
  dateString: string | Date,
  formatStr: string = 'MMM d, yyyy',
  timezone?: Timezone
): string {
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    const zonedDate = timezone ? utcToZonedTime(date, timezone) : date;
    return format(zonedDate, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

/**
 * Formats a date range into a human-readable string
 * @param startDate - Start date string or Date object
 * @param endDate - End date string or Date object (optional)
 * @param timezone - Timezone string (default: user's local timezone)
 * @returns Formatted date range string
 */
export function formatDateRange(
  startDate: string | Date,
  endDate?: string | Date | null,
  timezone?: Timezone
): string {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  
  if (!endDate) {
    return formatDate(start, 'MMM d, yyyy', timezone);
  }
  
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  // If same day
  if (format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd')) {
    return formatDate(start, 'MMM d, yyyy', timezone);
  }
  
  // Same month
  if (format(start, 'yyyy-MM') === format(end, 'yyyy-MM')) {
    return `${format(start, 'MMM d')} - ${format(end, 'd, yyyy')}`;
  }
  
  // Same year
  if (format(start, 'yyyy') === format(end, 'yyyy')) {
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
  }
  
  // Different years
  return `${formatDate(start, 'MMM d, yyyy', timezone)} - ${formatDate(end, 'MMM d, yyyy', timezone)}`;
}

/**
 * Formats a time range into a human-readable string
 * @param startTime - Start time string (ISO format or 'HH:mm')
 * @param endTime - End time string (ISO format or 'HH:mm')
 * @param timezone - Timezone string (default: user's local timezone)
 * @returns Formatted time range string
 */
export function formatTimeRange(
  startTime: string,
  endTime: string,
  timezone?: Timezone
): string {
  try {
    // Handle full ISO strings or just time strings
    const getTime = (timeStr: string) => {
      if (timeStr.includes('T')) {
        const date = new Date(timeStr);
        return timezone ? utcToZonedTime(date, timezone) : date;
      }
      // If just time string, use today's date with the time
      const [hours, minutes] = timeStr.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    };
    
    const start = getTime(startTime);
    const end = getTime(endTime);
    
    return `${format(start, 'h:mma')} - ${format(end, 'h:mma')}`.toLowerCase();
  } catch (error) {
    console.error('Error formatting time range:', error);
    return 'Invalid time range';
  }
}

/**
 * Formats a date and time into a human-readable string
 * @param dateTime - Date string or Date object
 * @param timezone - Timezone string (default: user's local timezone)
 * @returns Formatted date and time string
 */
export function formatDateTime(
  dateTime: string | Date,
  timezone?: Timezone
): string {
  const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
  return formatDate(date, 'MMM d, yyyy h:mma', timezone).toLowerCase();
}

/**
 * Gets the relative time from now (e.g., "2 days ago")
 * @param dateString - ISO date string or Date object
 * @returns Relative time string
 */
export function getRelativeTime(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  // Less than a minute
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  // Less than an hour
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  // Less than a day
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  // Less than a week
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  }
  
  // Less than a month
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} ${diffInWeeks === 1 ? 'week' : 'weeks'} ago`;
  }
  
  // Less than a year
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
  }
  
  // Years
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} ${diffInYears === 1 ? 'year' : 'years'} ago`;
}

/**
 * Checks if a date is in the past
 * @param date - Date string or Date object
 * @returns boolean indicating if the date is in the past
 */
export function isPastDate(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return isBefore(dateObj, new Date());
}

/**
 * Checks if a date is in the future
 * @param date - Date string or Date object
 * @returns boolean indicating if the date is in the future
 */
export function isFutureDate(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return isAfter(dateObj, new Date());
}

/**
 * Gets the start and end of a date range for filtering
 * @param range - Date range ('today', 'thisWeek', 'thisMonth', 'next7Days', 'next30Days')
 * @returns Object with start and end dates
 */
export function getDateRange(range: 'today' | 'thisWeek' | 'thisMonth' | 'next7Days' | 'next30Days') {
  const now = new Date();
  
  switch (range) {
    case 'today':
      return {
        start: new Date(now.setHours(0, 0, 0, 0)),
        end: new Date(now.setHours(23, 59, 59, 999))
      };
      
    case 'thisWeek':
      return {
        start: subDays(new Date(now.setHours(0, 0, 0, 0)), now.getDay()),
        end: addDays(new Date(now.setHours(23, 59, 59, 999)), 6 - now.getDay())
      };
      
    case 'thisMonth':
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      };
      
    case 'next7Days':
      return {
        start: new Date(now.setHours(0, 0, 0, 0)),
        end: addDays(new Date(now.setHours(23, 59, 59, 999)), 6)
      };
      
    case 'next30Days':
      return {
        start: new Date(now.setHours(0, 0, 0, 0)),
        end: addDays(new Date(now.setHours(23, 59, 59, 999)), 29)
      };
      
    default:
      return {
        start: new Date(now.setHours(0, 0, 0, 0)),
        end: addDays(new Date(now.setHours(23, 59, 59, 999)), 30)
      };
  }
}

/**
 * Formats a number as a currency string
 * @param amount - Amount to format
 * @param currency - Currency code (default: 'USD')
 * @param locale - Locale string (default: 'en-US')
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Truncates a string to a maximum length and adds an ellipsis if needed
 * @param str - String to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated string
 */
export function truncateString(str: string, maxLength: number = 100): string {
  if (!str) return '';
  return str.length > maxLength ? `${str.substring(0, maxLength)}...` : str;
}

/**
 * Generates initials from a name
 * @param name - Full name
 * @returns Initials (max 2 characters)
 */
export function getInitials(name: string): string {
  if (!name) return '';
  
  const parts = name.split(' ').filter(part => part.length > 0);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

/**
 * Converts a string to kebab-case
 * @param str - String to convert
 * @returns kebab-cased string
 */
export function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/--+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Converts a string to title case
 * @param str - String to convert
 * @returns Title-cased string
 */
export function toTitleCase(str: string): string {
  if (!str) return '';
  
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Generates a unique ID
 * @param prefix - Optional prefix for the ID
 * @returns Unique ID string
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Debounces a function
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function(this: any, ...args: Parameters<T>) {
    const context = this;
    
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

/**
 * Throttles a function
 * @param func - Function to throttle
 * @param limit - Time limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return function(this: any, ...args: Parameters<T>) {
    const context = this;
    
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}
