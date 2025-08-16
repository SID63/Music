declare module 'date-fns-tz' {
  import { DateLike } from 'date-fns';

  // Minimal typings matching what we use in the codebase
  export function utcToZonedTime(date: Date | number | string, timeZone: string): Date;
  export function zonedTimeToUtc(date: Date | number | string, timeZone: string): Date;
  export function formatInTimeZone(
    date: Date | number | string,
    timeZone: string,
    formatString: string
  ): string;
}
