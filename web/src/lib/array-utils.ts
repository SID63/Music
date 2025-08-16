/**
 * Type definitions for array utilities
 */
type KeySelector<T> = (item: T) => string | number;
type Comparator<T> = (a: T, b: T) => number;
type GroupedItems<T> = Record<string, T[]>;
type IndexedItems<T> = Record<string, T>;

/**
 * Array manipulation utilities
 */

/**
 * Removes duplicate items from an array based on a key selector function
 * @param array - The array to deduplicate
 * @param keySelector - Function that returns a unique key for each item
 * @returns A new array with duplicates removed
 */
export function deduplicate<T>(
  array: T[], 
  keySelector: KeySelector<T> = (item) => String(item)
): T[] {
  const seen = new Set<string | number>();
  return array.filter(item => {
    const key = keySelector(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Groups an array of items by a key
 * @param array - The array to group
 * @param keySelector - Function that returns the key to group by
 * @returns An object with keys as group names and values as arrays of items
 */
export function groupBy<T>(
  array: T[], 
  keySelector: KeySelector<T>
): GroupedItems<T> {
  return array.reduce<GroupedItems<T>>((result, item) => {
    const key = String(keySelector(item));
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(item);
    return result;
  }, {});
}

/**
 * Creates an index (object) from an array based on a key
 * @param array - The array to index
 * @param keySelector - Function that returns the key for each item
 * @returns An object with keys as the selected keys and values as the items
 */
export function indexBy<T>(
  array: T[], 
  keySelector: KeySelector<T>
): IndexedItems<T> {
  return array.reduce<IndexedItems<T>>((result, item) => {
    const key = String(keySelector(item));
    result[key] = item;
    return result;
  }, {});
}

/**
 * Flattens an array of arrays into a single array
 * @param array - The array of arrays to flatten
 * @returns A single flattened array
 */
export function flatten<T>(array: T[][]): T[] {
  return array.reduce((result, current) => [...result, ...current], []);
}

/**
 * Chunks an array into smaller arrays of a specified size
 * @param array - The array to chunk
 * @param size - The size of each chunk
 * @returns An array of chunks
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Shuffles an array in place using the Fisher-Yates algorithm
 * @param array - The array to shuffle
 * @returns A new shuffled array
 */
export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Returns a random item from an array
 * @param array - The array to pick from
 * @returns A random item from the array, or undefined if the array is empty
 */
export function sample<T>(array: T[]): T | undefined {
  if (array.length === 0) return undefined;
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Returns a specified number of random items from an array
 * @param array - The array to pick from
 * @param count - The number of items to pick
 * @returns An array of random items
 */
export function sampleSize<T>(array: T[], count: number): T[] {
  const shuffled = shuffle([...array]);
  return shuffled.slice(0, Math.min(count, array.length));
}

/**
 * Sorts an array by a key
 * @param array - The array to sort
 * @param keySelector - Function that returns the key to sort by
 * @param order - The sort order ('asc' or 'desc')
 * @returns A new sorted array
 */
export function sortBy<T>(
  array: T[], 
  keySelector: KeySelector<T>, 
  order: 'asc' | 'desc' = 'asc'
): T[] {
  return [...array].sort((a, b) => {
    const keyA = keySelector(a);
    const keyB = keySelector(b);
    
    if (keyA < keyB) return order === 'asc' ? -1 : 1;
    if (keyA > keyB) return order === 'asc' ? 1 : -1;
    return 0;
  });
}

/**
 * Sorts an array using a custom comparator function
 * @param array - The array to sort
 * @param comparator - The comparator function
 * @returns A new sorted array
 */
export function sortWith<T>(array: T[], comparator: Comparator<T>): T[] {
  return [...array].sort(comparator);
}

/**
 * Finds the minimum value in an array based on a key selector
 * @param array - The array to search
 * @param keySelector - Function that returns the key to compare
 * @returns The minimum value, or undefined if the array is empty
 */
export function minBy<T>(
  array: T[], 
  keySelector: (item: T) => number
): T | undefined {
  if (array.length === 0) return undefined;
  
  return array.reduce((min, current) => {
    return keySelector(current) < keySelector(min) ? current : min;
  }, array[0]);
}

/**
 * Finds the maximum value in an array based on a key selector
 * @param array - The array to search
 * @param keySelector - Function that returns the key to compare
 * @returns The maximum value, or undefined if the array is empty
 */
export function maxBy<T>(
  array: T[], 
  keySelector: (item: T) => number
): T | undefined {
  if (array.length === 0) return undefined;
  
  return array.reduce((max, current) => {
    return keySelector(current) > keySelector(max) ? current : max;
  }, array[0]);
}

/**
 * Calculates the sum of an array of numbers
 * @param array - The array of numbers
 * @returns The sum of the numbers
 */
export function sum(array: number[]): number {
  return array.reduce((total, current) => total + current, 0);
}

/**
 * Calculates the average of an array of numbers
 * @param array - The array of numbers
 * @returns The average of the numbers, or 0 if the array is empty
 */
export function average(array: number[]): number {
  if (array.length === 0) return 0;
  return sum(array) / array.length;
}

/**
 * Filters an array to only include unique items based on a key selector
 * @param array - The array to filter
 * @param keySelector - Function that returns a unique key for each item
 * @returns A new array with only unique items
 */
export function uniqueBy<T>(
  array: T[], 
  keySelector: KeySelector<T>
): T[] {
  const seen = new Set<string | number>();
  return array.filter(item => {
    const key = keySelector(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Creates an array of numbers from start to end (inclusive)
 * @param start - The start of the range
 * @param end - The end of the range
 * @param step - The step between numbers (default: 1)
 * @returns An array of numbers
 */
export function range(
  start: number, 
  end: number, 
  step: number = 1
): number[] {
  const result: number[] = [];
  for (let i = start; i <= end; i += step) {
    result.push(i);
  }
  return result;
}

/**
 * Zips multiple arrays together
 * @param arrays - The arrays to zip
 * @returns An array of tuples containing elements from each array
 */
export function zip<T extends unknown[]>(...arrays: { [K in keyof T]: T[K][] }): T[] {
  const maxLength = Math.max(...arrays.map(arr => arr.length));
  return Array.from({ length: maxLength }, (_, i) => 
    arrays.map(arr => arr[i])
  ) as T[];
}

/**
 * Unzips an array of tuples into separate arrays
 * @param array - The array to unzip
 * @returns An array of arrays, where each inner array contains elements from the same position
 */
export function unzip<T extends unknown[]>(array: T[]): { [K in keyof T]: T[K][] } {
  if (array.length === 0) return [] as unknown as { [K in keyof T]: T[K][] };
  
  return array[0].map((_, i) => 
    array.map(item => item[i])
  ) as { [K in keyof T]: T[K][] };
}

/**
 * Partitions an array into two arrays based on a predicate
 * @param array - The array to partition
 * @param predicate - The predicate function
 * @returns A tuple containing two arrays: [matching, nonMatching]
 */
export function partition<T>(
  array: T[], 
  predicate: (item: T) => boolean
): [T[], T[]] {
  return array.reduce<[T[], T[]]>(
    ([pass, fail], item) => {
      return predicate(item) 
        ? [[...pass, item], fail] 
        : [pass, [...fail, item]];
    },
    [[], []]
  );
}

/**
 * Creates an array of a specified length filled with the results of a mapping function
 * @param length - The length of the array
 * @param mapFn - The mapping function
 * @returns A new array with the mapped values
 */
export function times<T>(
  length: number, 
  mapFn: (index: number) => T
): T[] {
  return Array.from({ length }, (_, i) => mapFn(i));
}

/**
 * Creates an array of numbers from 0 to n-1
 * @param n - The upper bound (exclusive)
 * @returns An array of numbers from 0 to n-1
 */
export function rangeN(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i);
}

/**
 * Finds the difference between two arrays
 * @param array1 - The first array
 * @param array2 - The second array
 * @returns An array containing elements that are in array1 but not in array2
 */
export function difference<T>(
  array1: T[], 
  array2: T[]
): T[] {
  const set2 = new Set(array2);
  return array1.filter(x => !set2.has(x));
}

/**
 * Finds the intersection of two arrays
 * @param array1 - The first array
 * @param array2 - The second array
 * @returns An array containing elements that are in both arrays
 */
export function intersection<T>(
  array1: T[], 
  array2: T[]
): T[] {
  const set2 = new Set(array2);
  return array1.filter(x => set2.has(x));
}

/**
 * Finds the union of multiple arrays
 * @param arrays - The arrays to union
 * @returns An array containing all unique elements from the input arrays
 */
export function union<T>(...arrays: T[][]): T[] {
  return [...new Set(flatten(arrays))];
}

/**
 * Creates an array of key-value pairs from an object
 * @param obj - The object to convert
 * @returns An array of [key, value] tuples
 */
export function entries<T extends object>(
  obj: T
): [keyof T, T[keyof T]][] {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
}

/**
 * Creates an object from an array of key-value pairs
 * @param entries - The key-value pairs
 * @returns An object with the key-value pairs
 */
export function fromEntries<T = any>(
  entries: [string, T][]
): Record<string, T> {
  return entries.reduce<Record<string, T>>((obj, [key, value]) => {
    obj[key] = value;
    return obj;
  }, {});
}

/**
 * Creates an array of the object's own enumerable property values
 * @param obj - The object to get values from
 * @returns An array of the object's values
 */
export function values<T extends object>(
  obj: T
): T[keyof T][] {
  return Object.values(obj);
}

/**
 * Creates an array of the object's own enumerable property keys
 * @param obj - The object to get keys from
 * @returns An array of the object's keys
 */
export function keys<T extends object>(
  obj: T
): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}

/**
 * Creates a new object with the same keys but with values transformed by a function
 * @param obj - The source object
 * @param fn - The transformation function
 * @returns A new object with transformed values
 */
export function mapValues<T extends object, U>(
  obj: T,
  fn: (value: T[keyof T], key: keyof T) => U
): Record<keyof T, U> {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [
      key,
      fn(value as T[keyof T], key as keyof T)
    ])
  ) as Record<keyof T, U>;
}

/**
 * Creates a new object with the same values but with keys transformed by a function
 * @param obj - The source object
 * @param fn - The transformation function
 * @returns A new object with transformed keys
 */
export function mapKeys<T extends object, U extends string | number | symbol>(
  obj: T,
  fn: (value: T[keyof T], key: keyof T) => U
): Record<U, T[keyof T]> {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [
      fn(value as T[keyof T], key as keyof T),
      value
    ])
  ) as Record<U, T[keyof T]>;
}

/**
 * Creates a new object with only the specified keys
 * @param obj - The source object
 * @param keysToPick - The keys to include in the new object
 * @returns A new object with only the specified keys
 */
export function pick<T extends object, K extends keyof T>(
  obj: T,
  keysToPick: K[]
): Pick<T, K> {
  return keysToPick.reduce<Partial<Pick<T, K>>>((result, key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
    return result;
  }, {}) as Pick<T, K>;
}

/**
 * Creates a new object without the specified keys
 * @param obj - The source object
 * @param keysToOmit - The keys to exclude from the new object
 * @returns A new object without the specified keys
 */
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keysToOmit: K[]
): Omit<T, K> {
  const keysToOmitSet = new Set(keysToOmit as string[]);
  return Object.entries(obj).reduce<Partial<Omit<T, K>>>((result, [key, value]) => {
    if (!keysToOmitSet.has(key)) {
      (result as any)[key] = value;
    }
    return result;
  }, {}) as Omit<T, K>;
}

/**
 * Creates a deep clone of an object or array
 * @param value - The value to clone
 * @returns A deep clone of the value
 */
export function cloneDeep<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  
  if (Array.isArray(value)) {
    return value.map(item => cloneDeep(item)) as unknown as T;
  }
  
  if (value instanceof Date) {
    return new Date(value.getTime()) as unknown as T;
  }
  
  if (value instanceof Map) {
    const result = new Map();
    value.forEach((val, key) => {
      result.set(key, cloneDeep(val));
    });
    return result as unknown as T;
  }
  
  if (value instanceof Set) {
    const result = new Set();
    value.forEach(val => {
      result.add(cloneDeep(val));
    });
    return result as unknown as T;
  }
  
  const result: Record<string, any> = {};
  for (const key in value) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      result[key] = cloneDeep((value as any)[key]);
    }
  }
  
  return result as T;
}

/**
 * Checks if two values are deeply equal
 * @param a - The first value
 * @param b - The second value
 * @returns True if the values are deeply equal
 */
export function isEqual(a: any, b: any): boolean {
  // Primitive types and references
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return false;
  
  // Check for Date
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }
  
  // Check for Array
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => isEqual(item, b[index]));
  }
  
  // Check for Map
  if (a instanceof Map && b instanceof Map) {
    if (a.size !== b.size) return false;
    for (const [key, value] of a) {
      if (!b.has(key) || !isEqual(value, b.get(key))) {
        return false;
      }
    }
    return true;
  }
  
  // Check for Set
  if (a instanceof Set && b instanceof Set) {
    if (a.size !== b.size) return false;
    for (const value of a) {
      if (!b.has(value)) return false;
    }
    return true;
  }
  
  // Check for plain objects
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key) || !isEqual(a[key], b[key])) {
      return false;
    }
  }
  
  return true;
}
