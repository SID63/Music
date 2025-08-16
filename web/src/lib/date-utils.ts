import {
  format,
  formatDistanceToNow,
  formatDuration,
  intervalToDuration,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isSameYear,
  parseISO,
  subDays,
  addDays,
  addMonths,
  addYears,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  isWithinInterval,
} from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';

type Timezone = string;

/**
 * Timezone-related utilities
 */

/**
 * Gets the user's local timezone
 * @returns The local IANA timezone (e.g., 'America/New_York')
 */
export function getLocalTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Converts a date to a specific timezone
 * @param date - The date to convert
 * @param timezone - The target timezone (default: local timezone)
 * @returns The converted date
 */
export function toTimezone(date: Date | string, timezone: string = getLocalTimezone()): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return utcToZonedTime(dateObj, timezone);
}

/**
 * Converts a date from a specific timezone to UTC
 * @param date - The date to convert
 * @param timezone - The source timezone (default: local timezone)
 * @returns The UTC date
 */
export function toUTC(date: Date | string, timezone: string = getLocalTimezone()): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return zonedTimeToUtc(dateObj, timezone);
}

/**
 * Formats a date for display in a specific timezone
 * @param date - The date to format
 * @param formatStr - The format string (default: 'PPpp')
 * @param timezone - The target timezone (default: local timezone)
 * @returns The formatted date string
 */
export function formatInTimezone(
  date: Date | string,
  formatStr: string = 'PPpp',
  timezone: string = getLocalTimezone()
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const zonedDate = toTimezone(dateObj, timezone);
  return format(zonedDate, formatStr);
}

/**
 * Date formatting utilities
 */

/**
 * Formats a date in a human-readable relative format (e.g., '2 hours ago')
 * @param date - The date to format
 * @returns The formatted relative date string
 */
export function formatRelativeDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
}

/**
 * Formats a duration in a human-readable format (e.g., '2 hours 30 minutes')
 * @param start - The start date
 * @param end - The end date
 * @returns The formatted duration string
 */
export function formatDurationBetween(start: Date | string, end: Date | string): string {
  const startDate = typeof start === 'string' ? parseISO(start) : start;
  const endDate = typeof end === 'string' ? parseISO(end) : end;
  
  const duration = intervalToDuration({
    start: startDate,
    end: endDate,
  });
  
  return formatDuration(duration, {
    format: ['years', 'months', 'weeks', 'days', 'hours', 'minutes'],
    zero: false,
    delimiter: ', ',
  });
}

/**
 * Formats a date range in a concise format (e.g., 'Jan 1 - 3, 2023')
 * @param start - The start date
 * @param end - The end date
 * @param timezone - The timezone to use for formatting (default: local timezone)
 * @returns The formatted date range string
 */
export function formatDateRange(
  start: Date | string,
  end: Date | string,
  timezone: string = getLocalTimezone()
): string {
  const startDate = typeof start === 'string' ? parseISO(start) : start;
  const endDate = typeof end === 'string' ? parseISO(end) : end;
  
  const zonedStart = toTimezone(startDate, timezone);
  const zonedEnd = toTimezone(endDate, timezone);
  
  if (isSameDay(zonedStart, zonedEnd)) {
    // Same day: 'Jan 1, 2023, 1:00 PM - 3:00 PM'
    return `${format(zonedStart, 'PPP')}, ${format(zonedStart, 'p')} - ${format(zonedEnd, 'p')}`;
  }
  
  if (isSameMonth(zonedStart, zonedEnd) && isSameYear(zonedStart, zonedEnd)) {
    // Same month and year: 'Jan 1 - 3, 2023'
    return `${format(zonedStart, 'MMM d')} - ${format(zonedEnd, 'd, yyyy')}`;
  }
  
  if (isSameYear(zonedStart, zonedEnd)) {
    // Same year: 'Jan 1 - Feb 1, 2023'
    return `${format(zonedStart, 'MMM d')} - ${format(zonedEnd, 'MMM d, yyyy')}`;
  }
  
  // Different years: 'Dec 31, 2022 - Jan 1, 2023'
  return `${format(zonedStart, 'MMM d, yyyy')} - ${format(zonedEnd, 'MMM d, yyyy')}`;
}

/**
 * Date manipulation utilities
 */

/**
 * Gets the start and end of a day
 * @param date - The reference date
 * @param timezone - The timezone to use (default: local timezone)
 * @returns An object with start and end of day
 */
export function getDayRange(
  date: Date | string = new Date(),
  timezone: string = getLocalTimezone()
) {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const zonedDate = toTimezone(dateObj, timezone);
  
  return {
    start: startOfDay(zonedDate),
    end: endOfDay(zonedDate),
  };
}

/**
 * Gets the start and end of a week
 * @param date - The reference date
 * @param timezone - The timezone to use (default: local timezone)
 * @returns An object with start and end of week
 */
export function getWeekRange(
  date: Date | string = new Date(),
  timezone: string = getLocalTimezone()
) {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const zonedDate = toTimezone(dateObj, timezone);
  
  return {
    start: startOfWeek(zonedDate, { weekStartsOn: 1 }), // Monday
    end: endOfWeek(zonedDate, { weekStartsOn: 1 }), // Sunday
  };
}

/**
 * Gets the start and end of a month
 * @param date - The reference date
 * @param timezone - The timezone to use (default: local timezone)
 * @returns An object with start and end of month
 */
export function getMonthRange(
  date: Date | string = new Date(),
  timezone: string = getLocalTimezone()
) {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const zonedDate = toTimezone(dateObj, timezone);
  
  return {
    start: startOfMonth(zonedDate),
    end: endOfMonth(zonedDate),
  };
}

/**
 * Gets the start and end of a year
 * @param date - The reference date
 * @param timezone - The timezone to use (default: local timezone)
 * @returns An object with start and end of year
 */
export function getYearRange(
  date: Date | string = new Date(),
  timezone: string = getLocalTimezone()
) {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const zonedDate = toTimezone(dateObj, timezone);
  
  return {
    start: startOfYear(zonedDate),
    end: endOfYear(zonedDate),
  };
}

/**
 * Date validation utilities
 */

/**
 * Checks if a date is in the past
 * @param date - The date to check
 * @returns True if the date is in the past
 */
export function isInPast(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isBefore(dateObj, new Date());
}

/**
 * Checks if a date is in the future
 * @param date - The date to check
 * @returns True if the date is in the future
 */
export function isInFuture(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isAfter(dateObj, new Date());
}

/**
 * Checks if a date is today
 * @param date - The date to check
 * @param timezone - The timezone to use (default: local timezone)
 * @returns True if the date is today
 */
export function isDateToday(
  date: Date | string,
  timezone: string = getLocalTimezone()
): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const zonedDate = toTimezone(dateObj, timezone);
  const today = new Date();
  return isSameDay(zonedDate, today);
}

/**
 * Checks if a date is tomorrow
 * @param date - The date to check
 * @param timezone - The timezone to use (default: local timezone)
 * @returns True if the date is tomorrow
 */
export function isDateTomorrow(
  date: Date | string,
  timezone: string = getLocalTimezone()
): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const zonedDate = toTimezone(dateObj, timezone);
  const tomorrow = addDays(new Date(), 1);
  return isSameDay(zonedDate, tomorrow);
}

/**
 * Checks if a date is yesterday
 * @param date - The date to check
 * @param timezone - The timezone to use (default: local timezone)
 * @returns True if the date is yesterday
 */
export function isDateYesterday(
  date: Date | string,
  timezone: string = getLocalTimezone()
): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const zonedDate = toTimezone(dateObj, timezone);
  const yesterday = subDays(new Date(), 1);
  return isSameDay(zonedDate, yesterday);
}

/**
 * Date calculation utilities
 */

/**
 * Adds days to a date
 * @param date - The base date
 * @param days - The number of days to add (can be negative)
 * @returns The resulting date
 */
export function addDaysToDate(date: Date | string, days: number): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return addDays(dateObj, days);
}

/**
 * Adds months to a date
 * @param date - The base date
 * @param months - The number of months to add (can be negative)
 * @returns The resulting date
 */
export function addMonthsToDate(date: Date | string, months: number): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return addMonths(dateObj, months);
}

/**
 * Adds years to a date
 * @param date - The base date
 * @param years - The number of years to add (can be negative)
 * @returns The resulting date
 */
export function addYearsToDate(date: Date | string, years: number): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return addYears(dateObj, years);
}

/**
 * Gets the difference between two dates in days
 * @param start - The start date
 * @param end - The end date
 * @returns The difference in days
 */
export function getDaysDifference(start: Date | string, end: Date | string): number {
  const startDate = typeof start === 'string' ? parseISO(start) : start;
  const endDate = typeof end === 'string' ? parseISO(end) : end;
  return differenceInDays(endDate, startDate);
}

/**
 * Gets the difference between two dates in hours
 * @param start - The start date
 * @param end - The end date
 * @returns The difference in hours
 */
export function getHoursDifference(start: Date | string, end: Date | string): number {
  const startDate = typeof start === 'string' ? parseISO(start) : start;
  const endDate = typeof end === 'string' ? parseISO(end) : end;
  return differenceInHours(endDate, startDate);
}

/**
 * Gets the difference between two dates in minutes
 * @param start - The start date
 * @param end - The end date
 * @returns The difference in minutes
 */
export function getMinutesDifference(start: Date | string, end: Date | string): number {
  const startDate = typeof start === 'string' ? parseISO(start) : start;
  const endDate = typeof end === 'string' ? parseISO(end) : end;
  return differenceInMinutes(endDate, startDate);
}

/**
 * Gets the difference between two dates in seconds
 * @param start - The start date
 * @param end - The end date
 * @returns The difference in seconds
 */
export function getSecondsDifference(start: Date | string, end: Date | string): number {
  const startDate = typeof start === 'string' ? parseISO(start) : start;
  const endDate = typeof end === 'string' ? parseISO(end) : end;
  return differenceInSeconds(endDate, startDate);
}

/**
 * Date range utilities
 */

/**
 * Checks if a date is within a range
 * @param date - The date to check
 * @param range - The range to check against
 * @param timezone - The timezone to use (default: local timezone)
 * @returns True if the date is within the range
 */
export function isDateInRange(
  date: Date | string,
  range: { start: Date | string; end: Date | string },
  timezone: string = getLocalTimezone()
): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const startDate = typeof range.start === 'string' ? parseISO(range.start) : range.start;
  const endDate = typeof range.end === 'string' ? parseISO(range.end) : range.end;
  
  const zonedDate = toTimezone(dateObj, timezone);
  const zonedStart = toTimezone(startDate, timezone);
  const zonedEnd = toTimezone(endDate, timezone);
  
  return isWithinInterval(zonedDate, { start: zonedStart, end: zonedEnd });
}

/**
 * Gets all dates in a range
 * @param start - The start date
 * @param end - The end date
 * @returns An array of dates in the range (inclusive)
 */
export function getDatesInRange(start: Date | string, end: Date | string): Date[] {
  const startDate = typeof start === 'string' ? parseISO(start) : start;
  const endDate = typeof end === 'string' ? parseISO(end) : end;
  
  const dates: Date[] = [];
  let currentDate = startDate;
  
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate = addDays(currentDate, 1);
  }
  
  return dates;
}

/**
 * Recurring events utilities
 */

/**
 * Gets occurrences of a recurring event within a date range
 * @param start - The start date of the event
 * @param end - The end date of the event
 * @param frequency - The frequency of recurrence ('daily' | 'weekly' | 'monthly' | 'yearly')
 * @param interval - The interval of recurrence (e.g., 2 for every other occurrence)
 * @param range - The date range to get occurrences for
 * @param timezone - The timezone to use (default: local timezone)
 * @returns An array of date ranges for each occurrence
 */
export function getRecurringEventOccurrences(
  start: Date | string,
  end: Date | string,
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly',
  interval: number = 1,
  range: { start: Date | string; end: Date | string },
  timezone: string = getLocalTimezone()
): Array<{ start: Date; end: Date }> {
  const startDate = typeof start === 'string' ? parseISO(start) : start;
  const endDate = typeof end === 'string' ? parseISO(end) : end;
  const rangeStart = typeof range.start === 'string' ? parseISO(range.start) : range.start;
  const rangeEnd = typeof range.end === 'string' ? parseISO(range.end) : range.end;
  
  const occurrences: Array<{ start: Date; end: Date }> = [];
  let currentStart = new Date(startDate);
  let currentEnd = new Date(endDate);
  
  // Calculate the duration of the event in milliseconds
  const eventDuration = endDate.getTime() - startDate.getTime();
  
  // Add the first occurrence if it's within the range
  if (currentStart <= rangeEnd && currentEnd >= rangeStart) {
    occurrences.push({
      start: new Date(currentStart),
      end: new Date(currentEnd),
    });
  }
  
  // Generate recurring occurrences based on frequency and interval
  let count = 0;
  
  while (currentStart <= rangeEnd) {
    count++;
    
    // Skip occurrences that don't match the interval
    if (count % interval !== 0) {
      if (frequency === 'daily') currentStart = addDays(currentStart, 1);
      else if (frequency === 'weekly') currentStart = addDays(currentStart, 7);
      else if (frequency === 'monthly') currentStart = addMonths(currentStart, 1);
      else if (frequency === 'yearly') currentStart = addYears(currentStart, 1);
      
      currentEnd = new Date(currentStart.getTime() + eventDuration);
      continue;
    }
    
    // Calculate the next occurrence
    if (frequency === 'daily') {
      currentStart = addDays(currentStart, 1);
    } else if (frequency === 'weekly') {
      currentStart = addDays(currentStart, 7);
    } else if (frequency === 'monthly') {
      currentStart = addMonths(currentStart, 1);
    } else if (frequency === 'yearly') {
      currentStart = addYears(currentStart, 1);
    }
    
    currentEnd = new Date(currentStart.getTime() + eventDuration);
    
    // Stop if we've gone past the range
    if (currentStart > rangeEnd) break;
    
    // Add the occurrence if it's within the range
    if (currentEnd >= rangeStart) {
      occurrences.push({
        start: new Date(currentStart),
        end: new Date(currentEnd),
      });
    }
  }
  
  return occurrences;
}

/**
 * Time formatting utilities
 */

/**
 * Formats a time in 12-hour format (e.g., '2:30 PM')
 * @param date - The date to format
 * @param showMinutes - Whether to show minutes (default: true)
 * @returns The formatted time string
 */
export function formatTime12Hour(
  date: Date | string,
  showMinutes: boolean = true
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, showMinutes ? 'h:mm a' : 'h a');
}

/**
 * Formats a time in 24-hour format (e.g., '14:30')
 * @param date - The date to format
 * @param showMinutes - Whether to show minutes (default: true)
 * @returns The formatted time string
 */
export function formatTime24Hour(
  date: Date | string,
  showMinutes: boolean = true
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, showMinutes ? 'HH:mm' : 'HH');
}

/**
 * Countdown timer utilities
 */

/**
 * Gets the time remaining until a target date
 * @param target - The target date
 * @returns An object with days, hours, minutes, and seconds remaining
 */
export function getTimeRemaining(target: Date | string) {
  const targetDate = typeof target === 'string' ? parseISO(target) : target;
  const now = new Date();
  
  if (targetDate <= now) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isPast: true,
    };
  }
  
  const diff = targetDate.getTime() - now.getTime();
  
  const seconds = Math.floor((diff / 1000) % 60);
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  return {
    days,
    hours,
    minutes,
    seconds,
    isPast: false,
  };
}

/**
 * Business day utilities
 */

/**
 * Checks if a date is a business day (Monday to Friday)
 * @param date - The date to check
 * @param timezone - The timezone to use (default: local timezone)
 * @returns True if the date is a business day
 */
export function isBusinessDay(
  date: Date | string,
  timezone: string = getLocalTimezone()
): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const zonedDate = toTimezone(dateObj, timezone);
  const day = zonedDate.getDay();
  // 0 = Sunday, 6 = Saturday
  return day !== 0 && day !== 6;
}

/**
 * Gets the next business day
 * @param date - The reference date
 * @param timezone - The timezone to use (default: local timezone)
 * @returns The next business day
 */
export function getNextBusinessDay(
  date: Date | string = new Date(),
  timezone: string = getLocalTimezone()
): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const zonedDate = toTimezone(dateObj, timezone);
  
  let nextDay = addDays(zonedDate, 1);
  
  while (!isBusinessDay(nextDay, timezone)) {
    nextDay = addDays(nextDay, 1);
  }
  
  return nextDay;
}

/**
 * Adds business days to a date
 * @param date - The base date
 * @param days - The number of business days to add
 * @param timezone - The timezone to use (default: local timezone)
 * @returns The resulting date
 */
export function addBusinessDays(
  date: Date | string,
  days: number,
  timezone: string = getLocalTimezone()
): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const zonedDate = toTimezone(dateObj, timezone);
  
  let result = new Date(zonedDate);
  let daysAdded = 0;
  
  while (daysAdded < Math.abs(days)) {
    result = days > 0 ? addDays(result, 1) : subDays(result, 1);
    
    if (isBusinessDay(result, timezone)) {
      daysAdded++;
    }
  }
  
  return result;
}

/**
 * Gets the number of business days between two dates
 * @param start - The start date
 * @param end - The end date
 * @param timezone - The timezone to use (default: local timezone)
 * @returns The number of business days between the dates
 */
export function getBusinessDaysBetween(
  start: Date | string,
  end: Date | string,
  timezone: string = getLocalTimezone()
): number {
  const startDate = typeof start === 'string' ? parseISO(start) : start;
  const endDate = typeof end === 'string' ? parseISO(end) : end;
  
  const zonedStart = toTimezone(startDate, timezone);
  const zonedEnd = toTimezone(endDate, timezone);
  
  let current = new Date(zonedStart);
  let count = 0;
  
  while (current <= zonedEnd) {
    if (isBusinessDay(current, timezone)) {
      count++;
    }
    current = addDays(current, 1);
  }
  
  return count;
}

/**
 * Timezone conversion utilities
 */

/**
 * Converts a date from one timezone to another
 * @param date - The date to convert
 * @param fromTimezone - The source timezone
 * @param toTimezone - The target timezone
 * @returns The converted date
 */
export function convertTimezone(
  date: Date | string,
  fromTimezone: string,
  toTimezone: string
): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const utcDate = zonedTimeToUtc(dateObj, fromTimezone);
  return utcToZonedTime(utcDate, toTimezone);
}

/**
 * Gets the current time in a specific timezone
 * @param timezone - The target timezone
 * @returns The current date and time in the specified timezone
 */
export function getCurrentTimeInTimezone(timezone: string): Date {
  return utcToZonedTime(new Date(), timezone);
}

/**
 * Gets the timezone offset in minutes from UTC for a specific timezone
 * @param timezone - The timezone to get the offset for
 * @returns The timezone offset in minutes
 */
export function getTimezoneOffset(timezone: string): number {
  const date = new Date();
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  return (utcDate.getTime() - tzDate.getTime()) / 60000;
}

/**
 * Gets the timezone abbreviation (e.g., 'EST', 'PDT')
 * @param timezone - The timezone to get the abbreviation for
 * @param date - The reference date (default: current date)
 * @returns The timezone abbreviation
 */
export function getTimezoneAbbreviation(
  timezone: string,
  date: Date = new Date()
): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    })
      .formatToParts(date)
      .find((part) => part.type === 'timeZoneName')?.value || '';
  } catch (e) {
    console.error(`Error getting timezone abbreviation for ${timezone}:`, e);
    return '';
  }
}

/**
 * Gets a list of all IANA timezones
 * @returns An array of IANA timezone identifiers
 */
export function getAllTimezones(): string[] {
  try {
    const supportedValuesOf = (Intl as any).supportedValuesOf;
    if (typeof supportedValuesOf === 'function') {
      return supportedValuesOf('timeZone');
    }
    throw new Error('Intl.supportedValuesOf not available');
  } catch (e) {
    // Fallback for browsers that don't support Intl.supportedValuesOf
    return [
      'UTC',
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Phoenix',
      'America/Los_Angeles',
      'America/Anchorage',
      'America/Adak',
      'Pacific/Honolulu',
      'Europe/London',
      'Europe/Paris',
      'Europe/Berlin',
      'Asia/Tokyo',
      'Asia/Shanghai',
      'Asia/Dubai',
      'Australia/Sydney',
    ];
  }
}
