"use client";

import { useState, useEffect } from "react";

/**
 * Hook for working with localStorage with type safety
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Flag to indicate if we're on the client side
  const isClient = typeof window !== "undefined";

  // Initialize from localStorage on mount
  useEffect(() => {
    if (!isClient) return;

    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);

      // If error, use initial value
      setStoredValue(initialValue);
    }
  }, [key, initialValue, isClient]);

  // Update state and localStorage when value changes
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function for prevState pattern
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;

      // Save state
      setStoredValue(valueToStore);

      // Save to localStorage if on client
      if (isClient) {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  // Remove item from localStorage
  const removeItem = () => {
    try {
      // Remove from localStorage
      if (isClient) {
        window.localStorage.removeItem(key);
      }

      // Reset to initial value
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue, removeItem];
}
