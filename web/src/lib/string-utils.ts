/**
 * Truncates a string to a specified length and adds an ellipsis if needed
 * @param str - The string to truncate
 * @param maxLength - Maximum length before truncation (default: 100)
 * @param ellipsis - The ellipsis string to append (default: '...')
 * @returns The truncated string with ellipsis if needed
 */
export function truncate(str: string, maxLength: number = 100, ellipsis: string = '...'): string {
  if (!str || typeof str !== 'string') return '';
  if (str.length <= maxLength) return str;
  return `${str.substring(0, maxLength)}${ellipsis}`;
}

/**
 * Converts a string to title case
 * @param str - The string to convert
 * @returns The string in title case
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
 * Converts a string to kebab-case
 * @param str - The string to convert
 * @returns The string in kebab-case
 */
export function toKebabCase(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-');
}

/**
 * Converts a string to camelCase
 * @param str - The string to convert
 * @returns The string in camelCase
 */
export function toCamelCase(str: string): string {
  if (!str) return '';
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (letter, index) => 
      index === 0 ? letter.toLowerCase() : letter.toUpperCase()
    )
    .replace(/[^\w]/g, '');
}

/**
 * Converts a string to PascalCase
 * @param str - The string to convert
 * @returns The string in PascalCase
 */
export function toPascalCase(str: string): string {
  if (!str) return '';
  return str
    .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
    ?.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('') || '';
}

/**
 * Converts a string to snake_case
 * @param str - The string to convert
 * @returns The string in snake_case
 */
export function toSnakeCase(str: string): string {
  if (!str) return '';
  return str
    .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
    ?.map(word => word.toLowerCase())
    .join('_') || '';
}

/**
 * Removes all non-alphanumeric characters from a string
 * @param str - The string to clean
 * @returns The cleaned string with only alphanumeric characters
 */
export function removeNonAlphanumeric(str: string): string {
  if (!str) return '';
  return str.replace(/[^\p{L}\p{N}]+/gu, '');
}

/**
 * Generates a random string of specified length
 * @param length - The length of the random string (default: 10)
 * @returns A random string
 */
export function generateRandomString(length: number = 10): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Checks if a string is a valid email address
 * @param email - The email to validate
 * @returns Boolean indicating if the email is valid
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Checks if a string is a valid URL
 * @param url - The URL to validate
 * @returns Boolean indicating if the URL is valid
 */
export function isValidUrl(url: string): boolean {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Extracts domain from a URL
 * @param url - The URL to extract domain from
 * @returns The domain or empty string if invalid
 */
export function extractDomain(url: string): string {
  if (!url) return '';
  try {
    const { hostname } = new URL(url);
    return hostname.replace('www.', '');
  } catch (e) {
    return '';
  }
}

/**
 * Converts a string to a URL-friendly slug
 * @param str - The string to convert
 * @returns A URL-friendly slug
 */
export function toSlug(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Capitalizes the first letter of a string
 * @param str - The string to capitalize
 * @returns The string with the first letter capitalized
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Converts a string to a boolean
 * @param str - The string to convert
 * @param defaultValue - Default value if string is not a boolean (default: false)
 * @returns The boolean value of the string
 */
export function toBoolean(str: string | boolean | undefined | null, defaultValue: boolean = false): boolean {
  if (typeof str === 'boolean') return str;
  if (str === undefined || str === null) return defaultValue;
  
  const normalized = str.toString().toLowerCase().trim();
  if (['true', 'yes', '1', 'y'].includes(normalized)) return true;
  if (['false', 'no', '0', 'n'].includes(normalized)) return false;
  
  return defaultValue;
}

/**
 * Converts a string to a number
 * @param str - The string to convert
 * @param defaultValue - Default value if string is not a number (default: 0)
 * @returns The number value of the string
 */
export function toNumber(str: string | number | undefined | null, defaultValue: number = 0): number {
  if (typeof str === 'number') return str;
  if (!str) return defaultValue;
  
  const num = parseFloat(str);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Pads a number with leading zeros
 * @param num - The number to pad
 * @param size - The total width of the resulting string
 * @returns The padded string
 */
export function padNumber(num: number | string, size: number): string {
  let s = String(num);
  while (s.length < size) s = `0${s}`;
  return s;
}

/**
 * Masks sensitive information in a string (like email, phone, etc.)
 * @param str - The string to mask
 * @param type - The type of masking to apply ('email' | 'phone' | 'ssn' | 'credit-card')
 * @returns The masked string
 */
export function maskString(
  str: string,
  type: 'email' | 'phone' | 'ssn' | 'credit-card' = 'email'
): string {
  if (!str) return '';
  
  switch (type) {
    case 'email': {
      const [username, domain] = str.split('@');
      if (!username || !domain) return str;
      
      const maskedUsername = 
        username.length > 2 
          ? `${username[0]}${'*'.repeat(Math.min(3, username.length - 2))}${username.slice(-1)}`
          : username;
      
      return `${maskedUsername}@${domain}`;
    }
    
    case 'phone': {
      const digits = str.replace(/\D/g, '');
      if (digits.length < 4) return str;
      
      const lastFour = digits.slice(-4);
      return `***-***-${lastFour}`;
    }
    
    case 'ssn': {
      const digits = str.replace(/\D/g, '');
      if (digits.length < 4) return str;
      
      const lastFour = digits.slice(-4);
      return `***-**-${lastFour}`;
    }
    
    case 'credit-card': {
      const digits = str.replace(/\D/g, '');
      if (digits.length < 4) return str;
      
      const lastFour = digits.slice(-4);
      return `****-****-****-${lastFour}`;
    }
    
    default:
      return str;
  }
}

/**
 * Counts the number of words in a string
 * @param str - The string to count words in
 * @returns The word count
 */
export function countWords(str: string): number {
  if (!str) return 0;
  return str.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Counts the number of characters in a string (supports Unicode)
 * @param str - The string to count characters in
 * @returns The character count
 */
export function countChars(str: string): number {
  if (!str) return 0;
  return Array.from(str).length;
}

/**
 * Checks if a string contains HTML tags
 * @param str - The string to check
 * @returns Boolean indicating if the string contains HTML tags
 */
export function containsHtml(str: string): boolean {
  if (!str) return false;
  return /<[a-z][\s\S]*>/i.test(str);
}

/**
 * Strips HTML tags from a string
 * @param str - The string to strip HTML from
 * @returns The string with HTML tags removed
 */
export function stripHtml(str: string): string {
  if (!str) return '';
  return str.replace(/<[^>]*>?/gm, '');
}

/**
 * Escapes a string for use in HTML
 * @param str - The string to escape
 * @returns The escaped string
 */
export function escapeHtml(str: string): string {
  if (!str) return '';
  
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Unescapes HTML entities in a string
 * @param str - The string to unescape
 * @returns The unescaped string
 */
export function unescapeHtml(str: string): string {
  if (!str) return '';
  
  const div = document.createElement('div');
  div.innerHTML = str;
  return div.textContent || '';
}

/**
 * Converts line breaks to <br> tags
 * @param str - The string to convert
 * @returns The string with line breaks converted to <br> tags
 */
export function nl2br(str: string): string {
  if (!str) return '';
  return str.replace(/\n/g, '<br>');
}

/**
 * Converts <br> tags to line breaks
 * @param str - The string to convert
 * @returns The string with <br> tags converted to line breaks
 */
export function br2nl(str: string): string {
  if (!str) return '';
  return str.replace(/<br\s*\/?>/gi, '\n');
}

/**
 * Truncates a string to the nearest word boundary
 * @param str - The string to truncate
 * @param maxLength - Maximum length before truncation (default: 100)
 * @param ellipsis - The ellipsis string to append (default: '...')
 * @returns The truncated string with ellipsis if needed
 */
export function truncateWords(str: string, maxLength: number = 100, ellipsis: string = '...'): string {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  
  // Find the last space before maxLength
  let lastSpace = str.lastIndexOf(' ', maxLength);
  if (lastSpace === -1) {
    // No spaces found, just truncate
    return `${str.substring(0, maxLength)}${ellipsis}`;
  }
  
  return `${str.substring(0, lastSpace)}${ellipsis}`;
}

/**
 * Generates a hash code from a string
 * @param str - The string to generate a hash from
 * @returns A 32-bit signed integer hash code
 */
export function hashCode(str: string): number {
  if (!str) return 0;
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return hash;
}

/**
 * Generates a random hexadecimal color code
 * @returns A random hex color code (e.g., '#1a2b3c')
 */
export function randomHexColor(): string {
  return `#${Math.floor(Math.random() * 0x1000000).toString(16).padStart(6, '0')}`;
}

/**
 * Generates initials from a name
 * @param name - The full name
 * @param maxLength - Maximum number of initials to return (default: 2)
 * @returns The initials in uppercase
 */
export function getInitials(name: string, maxLength: number = 2): string {
  if (!name) return '';
  
  const words = name.trim().split(/\s+/);
  if (words.length === 0) return '';
  
  // If only one word, return first maxLength characters
  if (words.length === 1) {
    return words[0].substring(0, maxLength).toUpperCase();
  }
  
  // Otherwise, take first letter of first word and last word
  const first = words[0][0] || '';
  const last = words[words.length - 1][0] || '';
  
  return `${first}${last}`.toUpperCase().substring(0, maxLength);
}

/**
 * Converts a string to a URL-friendly slug with a random suffix
 * @param str - The string to convert
 * @param suffixLength - Length of the random suffix (default: 6)
 * @returns A URL-friendly slug with a random suffix
 */
export function toUniqueSlug(str: string, suffixLength: number = 6): string {
  const baseSlug = toSlug(str);
  const randomSuffix = generateRandomString(suffixLength).toLowerCase();
  return `${baseSlug}-${randomSuffix}`;
}

/**
 * Truncates a string to a specified number of words
 * @param str - The string to truncate
 * @param wordCount - Maximum number of words (default: 10)
 * @param ellipsis - The ellipsis string to append (default: '...')
 * @returns The truncated string
 */
export function truncateToWords(str: string, wordCount: number = 10, ellipsis: string = '...'): string {
  if (!str) return '';
  
  const words = str.trim().split(/\s+/);
  if (words.length <= wordCount) return str;
  
  return `${words.slice(0, wordCount).join(' ')}${ellipsis}`;
}

/**
 * Checks if a string is a valid hexadecimal color code
 * @param color - The color string to validate
 * @returns Boolean indicating if the string is a valid hex color
 */
export function isValidHexColor(color: string): boolean {
  if (!color) return false;
  return /^#([0-9A-F]{3}){1,2}$/i.test(color);
}

/**
 * Converts a string to a boolean based on common truthy/falsy values
 * @param str - The string to convert
 * @returns The boolean value
 */
export function stringToBoolean(str: string | boolean | undefined | null): boolean {
  if (typeof str === 'boolean') return str;
  if (!str) return false;
  
  const normalized = str.toString().toLowerCase().trim();
  return ['true', 'yes', '1', 'y', 'on'].includes(normalized);
}

/**
 * Removes all whitespace from a string
 * @param str - The string to process
 * @returns The string with all whitespace removed
 */
export function removeWhitespace(str: string): string {
  if (!str) return '';
  return str.replace(/\s+/g, '');
}

/**
 * Replaces all occurrences of multiple search strings with replacements
 * @param str - The string to process
 * @param replacements - Object mapping search strings to their replacements
 * @returns The processed string
 */
export function replaceMultiple(
  str: string,
  replacements: Record<string, string>
): string {
  if (!str) return '';
  
  let result = str;
  for (const [search, replacement] of Object.entries(replacements)) {
    result = result.split(search).join(replacement);
  }
  
  return result;
}

/**
 * Converts a string to a URL-friendly filename
 * @param str - The string to convert
 * @returns A URL-friendly filename
 */
export function toFilename(str: string): string {
  if (!str) return '';
  
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}
