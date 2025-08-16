import { isEqual as arrayIsEqual } from './array-utils';

/**
 * Type definitions for object utilities
 */
type Key = string | number | symbol;
type Value = any;
type Entry<T = any> = [string, T];
type Predicate<T> = (value: T[keyof T], key: keyof T) => boolean;
type Mapper<T, U> = (value: T[keyof T], key: keyof T) => U;
type Reducer<T, U> = (result: U, value: T[keyof T], key: keyof T) => U;

/**
 * Object manipulation utilities
 */

/**
 * Creates a new object with the same values but with keys transformed by a function
 * @param obj - The source object
 * @param transform - The transformation function
 * @returns A new object with transformed keys
 */
export function mapKeys<T extends object, U extends Key>(
  obj: T,
  transform: (key: keyof T, value: T[keyof T]) => U
): Record<U, T[keyof T]> {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [
      transform(key as keyof T, value as T[keyof T]),
      value
    ])
  ) as Record<U, T[keyof T]>;
}

/**
 * Creates a new object with the same keys but with values transformed by a function
 * @param obj - The source object
 * @param transform - The transformation function
 * @returns A new object with transformed values
 */
export function mapValues<T extends object, U>(
  obj: T,
  transform: (value: T[keyof T], key: keyof T) => U
): Record<keyof T, U> {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [
      key,
      transform(value as T[keyof T], key as keyof T)
    ])
  ) as Record<keyof T, U>;
}

/**
 * Creates a new object with only the entries that pass the predicate
 * @param obj - The source object
 * @param predicate - The filter function
 * @returns A new object with filtered entries
 */
export function filterObject<T extends object>(
  obj: T,
  predicate: Predicate<T>
): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([key, value]) =>
      predicate(value as T[keyof T], key as keyof T)
    )
  ) as Partial<T>;
}

/**
 * Reduces an object to a single value
 * @param obj - The source object
 * @param reducer - The reducer function
 * @param initialValue - The initial value
 * @returns The reduced value
 */
export function reduceObject<T extends object, U>(
  obj: T,
  reducer: Reducer<T, U>,
  initialValue: U
): U {
  return Object.entries(obj).reduce(
    (result, [key, value]) =>
      reducer(result, value as T[keyof T], key as keyof T),
    initialValue
  );
}

/**
 * Inverts the keys and values of an object
 * @param obj - The source object
 * @returns A new object with inverted keys and values
 */
export function invert<T extends object>(
  obj: T
): Record<string, keyof T> {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [String(value), key])
  ) as Record<string, keyof T>;
}

/**
 * Picks specific properties from an object
 * @param obj - The source object
 * @param keys - The keys to pick
 * @returns A new object with only the picked properties
 */
export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  return keys.reduce((result, key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
    return result;
  }, {} as Pick<T, K>);
}

/**
 * Omits specific properties from an object
 * @param obj - The source object
 * @param keys - The keys to omit
 * @returns A new object without the omitted properties
 */
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const keysToOmit = new Set(keys as Key[]);
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !keysToOmit.has(key))
  ) as Omit<T, K>;
}

/**
 * Gets the value at the specified path in an object
 * @param obj - The source object
 * @param path - The path to the value (e.g., 'a.b.c' or ['a', 'b', 'c'])
 * @param defaultValue - The default value if the path doesn't exist
 * @returns The value at the specified path or the default value
 */
export function get<T extends object, U = undefined>(
  obj: T,
  path: string | (string | number)[],
  defaultValue?: U
): any | U {
  const pathArray = Array.isArray(path) ? path : path.split('.').filter(Boolean);
  
  let result: any = obj;
  for (const key of pathArray) {
    result = result?.[key];
    if (result === undefined) return defaultValue as U;
  }
  
  return result === undefined ? defaultValue : result;
}

/**
 * Sets the value at the specified path in an object
 * @param obj - The source object
 * @param path - The path to set (e.g., 'a.b.c' or ['a', 'b', 'c'])
 * @param value - The value to set
 * @returns A new object with the updated value
 */
export function set<T extends object>(
  obj: T,
  path: string | (string | number)[],
  value: any
): T {
  const pathArray = Array.isArray(path) ? path : path.split('.').filter(Boolean);
  
  if (pathArray.length === 0) return obj;
  
  const [currentKey, ...restPath] = pathArray;
  const currentValue = (obj as any)[currentKey];
  
  if (restPath.length === 0) {
    return {
      ...obj,
      [currentKey]: value,
    } as T;
  }
  
  if (Array.isArray(currentValue)) {
    const newArray = [...currentValue];
    const index = Number(restPath[0]);
    
    if (restPath.length === 1) {
      newArray[index] = value;
    } else {
      newArray[index] = set(
        currentValue[index] || {},
        restPath.slice(1),
        value
      );
    }
    
    return {
      ...obj,
      [currentKey]: newArray,
    } as T;
  }
  
  const newValue = set(
    typeof currentValue === 'object' && currentValue !== null ? currentValue : {},
    restPath,
    value
  );
  
  return {
    ...obj,
    [currentKey]: newValue,
  } as T;
}

/**
 * Creates a deep clone of an object
 * @param obj - The object to clone
 * @returns A deep clone of the object
 */
export function cloneDeep<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => cloneDeep(item)) as unknown as T;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }
  
  if (obj instanceof Map) {
    const result = new Map();
    obj.forEach((value, key) => {
      result.set(key, cloneDeep(value));
    });
    return result as unknown as T;
  }
  
  if (obj instanceof Set) {
    const result = new Set();
    obj.forEach(value => {
      result.add(cloneDeep(value));
    });
    return result as unknown as T;
  }
  
  const result: Record<string, any> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = cloneDeep((obj as any)[key]);
    }
  }
  
  return result as T;
}

/**
 * Merges two objects deeply
 * @param target - The target object
 * @param source - The source object
 * @returns A new merged object
 */
export function merge<T extends object, U extends object>(
  target: T,
  source: U
): T & U {
  const result: any = { ...target };
  
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const targetValue = (target as any)[key];
      const sourceValue = (source as any)[key];
      
      if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
        result[key] = [...targetValue, ...sourceValue];
      } else if (
        typeof targetValue === 'object' &&
        targetValue !== null &&
        typeof sourceValue === 'object' &&
        sourceValue !== null
      ) {
        result[key] = merge(targetValue, sourceValue);
      } else {
        result[key] = sourceValue;
      }
    }
  }
  
  return result as T & U;
}

/**
 * Creates a new object with the same keys but with null values
 * @param obj - The source object
 * @returns A new object with null values
 */
export function nullify<T extends object>(
  obj: T
): { [K in keyof T]: null } {
  return mapValues(obj, () => null) as { [K in keyof T]: null };
}

/**
 * Creates a new object with the same keys but with undefined values
 * @param obj - The source object
 * @returns A new object with undefined values
 */
export function undefinify<T extends object>(
  obj: T
): { [K in keyof T]: undefined } {
  return mapValues(obj, () => undefined) as { [K in keyof T]: undefined };
}

/**
 * Creates a new object with the same keys but with empty string values
 * @param obj - The source object
 * @returns A new object with empty string values
 */
export function stringify<T extends object>(
  obj: T
): { [K in keyof T]: string } {
  return mapValues(obj, (value) =>
    value === null || value === undefined ? '' : String(value)
  ) as { [K in keyof T]: string };
}

/**
 * Creates a new object with the same keys but with values converted to numbers
 * @param obj - The source object
 * @returns A new object with number values
 */
export function numberify<T extends object>(
  obj: T
): { [K in keyof T]: number } {
  return mapValues(obj, (value) => {
    if (value === null || value === undefined) return 0;
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  }) as { [K in keyof T]: number };
}

/**
 * Creates a new object with the same keys but with values converted to booleans
 * @param obj - The source object
 * @returns A new object with boolean values
 */
export function booleanify<T extends object>(
  obj: T
): { [K in keyof T]: boolean } {
  return mapValues(obj, (value) => Boolean(value)) as { [K in keyof T]: boolean };
}

/**
 * Creates a new object with the same keys but with values transformed by a function
 * @param obj - The source object
 * @param transform - The transformation function
 * @returns A new object with transformed values
 */
export function transformValues<T extends object, U>(
  obj: T,
  transform: (value: T[keyof T], key: keyof T) => U
): { [K in keyof T]: U } {
  return mapValues(obj, transform) as { [K in keyof T]: U };
}

/**
 * Creates a new object with the same values but with keys transformed by a function
 * @param obj - The source object
 * @param transform - The transformation function
 * @returns A new object with transformed keys
 */
export function transformKeys<T extends object, U extends Key>(
  obj: T,
  transform: (key: keyof T, value: T[keyof T]) => U
): { [K in U]: T[keyof T] } {
  return mapKeys(obj, transform) as { [K in U]: T[keyof T] };
}

/**
 * Creates a new object with entries that pass the predicate
 * @param obj - The source object
 * @param predicate - The filter function
 * @returns A new object with filtered entries
 */
export function filterEntries<T extends object>(
  obj: T,
  predicate: (entry: [keyof T, T[keyof T]]) => boolean
): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([key, value]) =>
      predicate([key as keyof T, value as T[keyof T]])
    )
  ) as Partial<T>;
}

/**
 * Creates a new object with entries transformed by a function
 * @param obj - The source object
 * @param transform - The transformation function
 * @returns A new object with transformed entries
 */
export function mapEntries<T extends object, U>(
  obj: T,
  transform: (entry: [keyof T, T[keyof T]]) => [Key, U]
): Record<Key, U> {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) =>
      transform([key as keyof T, value as T[keyof T]])
    )
  ) as Record<Key, U>;
}

/**
 * Creates a new object with keys and values swapped
 * @param obj - The source object
 * @returns A new object with keys and values swapped
 */
export function invertMap<T extends Record<Key, Key>>(
  obj: T
): { [K in keyof T as T[K]]: K } {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [value, key])
  ) as { [K in keyof T as T[K]]: K };
}

/**
 * Creates a new object with only the specified keys
 * @param obj - The source object
 * @param keys - The keys to include
 * @returns A new object with only the specified keys
 */
export function pickBy<T extends object>(
  obj: T,
  predicate: (value: T[keyof T], key: keyof T) => boolean
): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([key, value]) =>
      predicate(value as T[keyof T], key as keyof T)
    )
  ) as Partial<T>;
}

/**
 * Creates a new object without the specified keys
 * @param obj - The source object
 * @param keys - The keys to exclude
 * @returns A new object without the specified keys
 */
export function omitBy<T extends object>(
  obj: T,
  predicate: (value: T[keyof T], key: keyof T) => boolean
): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([key, value]) => !predicate(value as T[keyof T], key as keyof T)
    )
  ) as Partial<T>;
}

/**
 * Creates a new object with the same keys but with values transformed by a function
 * @param obj - The source object
 * @param transform - The transformation function
 * @returns A new object with transformed values
 */
export function mapObject<T extends object, U>(
  obj: T,
  transform: (value: T[keyof T], key: keyof T) => U
): { [K in keyof T]: U } {
  return mapValues(obj, transform) as { [K in keyof T]: U };
}

/**
 * Creates a new object with the same values but with keys transformed by a function
 * @param obj - The source object
 * @param transform - The transformation function
 * @returns A new object with transformed keys
 */
export function mapObjectKeys<T extends object, U extends Key>(
  obj: T,
  transform: (key: keyof T, value: T[keyof T]) => U
): { [K in U]: T[keyof T] } {
  return mapKeys(obj, transform) as { [K in U]: T[keyof T] };
}

/**
 * Creates a new object with entries that pass the predicate
 * @param obj - The source object
 * @param predicate - The filter function
 * @returns A new object with filtered entries
 */
export function filterObjectBy<T extends object>(
  obj: T,
  predicate: (value: T[keyof T], key: keyof T) => boolean
): Partial<T> {
  return filterObject(obj, predicate);
}

/**
 * Checks if an object has a nested property
 * @param obj - The source object
 * @param path - The path to check (e.g., 'a.b.c' or ['a', 'b', 'c'])
 * @returns True if the path exists in the object
 */
export function hasIn(obj: object, path: string | (string | number)[]): boolean {
  const pathArray = Array.isArray(path) ? path : path.split('.').filter(Boolean);
  
  let current: any = obj;
  for (const key of pathArray) {
    if (current === null || typeof current !== 'object' || !(key in current)) {
      return false;
    }
    current = current[key];
  }
  
  return true;
}

/**
 * Creates a new object with the specified paths
 * @param obj - The source object
 * @param paths - The paths to pick (e.g., ['a.b.c', 'x.y.z'])
 * @returns A new object with the specified paths
 */
export function pickPaths<T extends object>(
  obj: T,
  paths: string[]
): Record<string, any> {
  const result: Record<string, any> = {};
  
  for (const path of paths) {
    const value = get(obj, path);
    if (value !== undefined) {
      set(result, path, value);
    }
  }
  
  return result;
}

/**
 * Creates a new object without the specified paths
 * @param obj - The source object
 * @param paths - The paths to omit (e.g., ['a.b.c', 'x.y.z'])
 * @returns A new object without the specified paths
 */
export function omitPaths<T extends object>(
  obj: T,
  paths: string[]
): Record<string, any> {
  const result = cloneDeep(obj);
  
  for (const path of paths) {
    const pathArray = path.split('.').filter(Boolean);
    if (pathArray.length === 0) continue;
    
    const lastKey = pathArray.pop()!;
    const parentPath = pathArray.join('.');
    const parent = parentPath ? get(result, parentPath) : result;
    
    if (parent && typeof parent === 'object' && lastKey in parent) {
      if (pathArray.length === 0) {
        delete (result as any)[lastKey];
      } else {
        const parentObj = get(result, parentPath);
        if (parentObj && typeof parentObj === 'object') {
          delete parentObj[lastKey];
          set(result, parentPath, parentObj);
        }
      }
    }
  }
  
  return result;
}

/**
 * Creates a new object with default values for missing properties
 * @param obj - The source object
 * @param defaults - The default values
 * @returns A new object with default values for missing properties
 */
export function defaults<T extends object, U extends object>(
  obj: T,
  defaults: U
): T & U {
  const result = { ...cloneDeep(defaults) } as T & U;
  
  for (const key in obj) {
    if (obj[key] !== undefined) {
      (result as any)[key] = obj[key];
    }
  }
  
  return result;
}

/**
 * Creates a new object with properties that exist in both objects
 * @param obj1 - The first object
 * @param obj2 - The second object
 * @returns A new object with common properties
 */
export function intersection<T extends object, U extends object>(
  obj1: T,
  obj2: U
): Partial<T & U> {
  const result: Partial<T & U> = {};
  
  for (const key in obj1) {
    if (key in obj2) {
      (result as any)[key] = (obj1 as any)[key];
    }
  }
  
  return result;
}

/**
 * Creates a new object with properties that exist in either object
 * @param obj1 - The first object
 * @param obj2 - The second object
 * @returns A new object with all properties from both objects
 */
export function union<T extends object, U extends object>(
  obj1: T,
  obj2: U
): T & U {
  return { ...cloneDeep(obj1), ...cloneDeep(obj2) };
}

/**
 * Creates a new object with properties that exist in the first object but not in the second
 * @param obj1 - The first object
 * @param obj2 - The second object
 * @returns A new object with the difference in properties
 */
export function difference<T extends object, U extends object>(
  obj1: T,
  obj2: U
): Partial<T> {
  const result: Partial<T> = {};
  
  for (const key in obj1) {
    if (!(key in obj2)) {
      (result as any)[key] = (obj1 as any)[key];
    }
  }
  
  return result;
}

/**
 * Checks if two objects are deeply equal
 * @param obj1 - The first object
 * @param obj2 - The second object
 * @returns True if the objects are deeply equal
 */
export function isEqual(obj1: any, obj2: any): boolean {
  return arrayIsEqual(obj1, obj2);
}

/**
 * Creates a new object with the same keys but with values transformed by a function
 * @param obj - The source object
 * @param transform - The transformation function
 * @returns A new object with transformed values
 */
export function transformObject<T extends object, U>(
  obj: T,
  transform: (value: T[keyof T], key: keyof T) => U
): { [K in keyof T]: U } {
  return mapValues(obj, transform) as { [K in keyof T]: U };
}
