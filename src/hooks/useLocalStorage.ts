import { useState, useEffect, useCallback } from 'react';

/**
 * Interface for values stored in localStorage with optional expiration
 */
interface StoredValue<T> {
  value: T;
  expiry: number | null;
}

/**
 * Options for useLocalStorage hook
 */
interface LocalStorageOptions {
  /**
   * Time to live in milliseconds
   * When specified, stored values will expire after this duration
   */
  ttl?: number;
  
  /**
   * Whether to sync state across tabs/windows
   * @default true
   */
  syncAcrossTabs?: boolean;
  
  /**
   * Custom serialization function
   * @default JSON.stringify
   */
  serialize?: <T>(value: StoredValue<T>) => string;
  
  /**
   * Custom deserialization function
   * @default JSON.parse
   */
  deserialize?: <T>(value: string) => StoredValue<T>;
}

/**
 * Return type for useLocalStorage hook
 */
type UseLocalStorageReturn<T> = [
  value: T,
  setValue: (value: T | ((prevValue: T) => T)) => void,
  remove: () => void
];

/**
 * Read value from localStorage with expiration check
 * @param key - localStorage key
 * @param initialValue - fallback value if key doesn't exist or is expired
 * @param options - custom options for deserialization
 * @returns The stored value or initialValue
 */
function readFromStorage<T>(
  key: string, 
  initialValue: T, 
  options?: Pick<LocalStorageOptions, 'deserialize'>
): T {
  if (typeof window === 'undefined') return initialValue;

  try {
    const item = window.localStorage.getItem(key);
    if (!item) return initialValue;

    const deserializer = options?.deserialize || JSON.parse;
    const storedItem: StoredValue<T> = deserializer(item);
    
    // Check if the value has expired
    if (storedItem.expiry && Date.now() > storedItem.expiry) {
      window.localStorage.removeItem(key);
      return initialValue;
    }

    return storedItem.value;
  } catch (error) {
    console.error(`[useLocalStorage] Error reading from localStorage key "${key}":`, error);
    return initialValue;
  }
}

/**
 * Write value to localStorage with optional expiration
 * @param key - localStorage key
 * @param value - value to store
 * @param options - ttl and serialization options
 */
function writeToStorage<T>(
  key: string, 
  value: T, 
  options?: Pick<LocalStorageOptions, 'ttl' | 'serialize'>
): void {
  if (typeof window === 'undefined') return;

  try {
    const expiry = options?.ttl ? Date.now() + options.ttl : null;
    const payload: StoredValue<T> = { value, expiry };
    
    const serializer = options?.serialize || JSON.stringify;
    window.localStorage.setItem(key, serializer(payload));
  } catch (error) {
    console.error(`[useLocalStorage] Error writing to localStorage key "${key}":`, error);
  }
}

/**
 * Enhanced localStorage hook with TypeScript support, expiration, and cross-tab sync
 * 
 * @param key - The localStorage key to use
 * @param initialValue - Initial value if no value is found in localStorage
 * @param options - Configuration options
 * @returns [storedValue, setValue, remove]
 * 
 * @example
 * // Basic usage
 * const [token, setToken, removeToken] = useLocalStorage('auth_token', null);
 * 
 * @example
 * // With expiration (TTL)
 * const [session, setSession] = useLocalStorage('user_session', null, { 
 *   ttl: 24 * 60 * 60 * 1000 // 24 hours 
 * });
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: LocalStorageOptions = {}
): UseLocalStorageReturn<T> {
  // Set defaults for options
  const { 
    ttl, 
    syncAcrossTabs = true,
    serialize,
    deserialize
  } = options;

  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => 
    readFromStorage(key, initialValue, { deserialize })
  );

  // Return a wrapped version of useState's setter function that persists to localStorage
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    setStoredValue((prevValue) => {
      // Allow value to be a function so we have same API as useState
      const newValue = value instanceof Function ? value(prevValue) : value;
      
      // Save to localStorage
      writeToStorage(key, newValue, { ttl, serialize });
      
      return newValue;
    });
  }, [key, ttl, serialize]);

  // Remove the item from localStorage and reset state
  const remove = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`[useLocalStorage] Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Sync state across tabs if enabled
  useEffect(() => {
    if (!syncAcrossTabs) return;
    
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== key) return;
      
      if (event.newValue === null) {
        // Item was removed
        setStoredValue(initialValue);
      } else {
        // Item was updated in another tab
        setStoredValue(readFromStorage(key, initialValue, { deserialize }));
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, initialValue, syncAcrossTabs, deserialize]);

  return [storedValue, setValue, remove];
}

/**
 * Legacy hook with time-to-live functionality
 * @deprecated Use useLocalStorage with options instead
 */
export function useLocalStorageWithTTL<T>(
  key: string,
  initialValue: T,
  options?: { ttl?: number }
) {
  return useLocalStorage(key, initialValue, options);
}
