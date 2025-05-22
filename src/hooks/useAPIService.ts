"use client";

import { useState, useCallback, useEffect } from "react";
import { useErrorHandler } from "./useErrorHandler";
import { toast } from "react-hot-toast";

// Define common API response interface
interface APIResponse<T> {
  success?: boolean;
  message?: string;
  error?: string;
  data?: T;
}

interface APIServiceState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

interface APIServiceOptions {
  cacheTime?: number; // Time in ms to cache the data
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  errorMessage?: string;
  successMessage?: string;
}

const DEFAULT_OPTIONS: APIServiceOptions = {
  cacheTime: 5 * 60 * 1000, // 5 minutes
  showSuccessToast: false,
  showErrorToast: true,
  errorMessage: "An error occurred",
  successMessage: "Success",
};

/**
 * Enhanced hook for managing API service calls with loading and error states
 * Includes caching and better error handling
 */
export function useAPIService<T>(
  initialData: T | null = null,
  options: APIServiceOptions = {}
) {
  const [state, setState] = useState<APIServiceState<T>>({
    data: initialData,
    isLoading: false,
    error: null,
    lastUpdated: null,
  });

  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const { handleError } = useErrorHandler();

  /**
   * Execute an API call and manage loading/error states
   */
  const execute = useCallback(
    async <R extends APIResponse<any> = APIResponse<T>>(
      apiCall: () => Promise<{ data: R }>,
      options: {
        onSuccess?: (data: R) => void;
        onError?: (error: any) => void;
        transform?: (data: R) => T;
        skipCache?: boolean;
      } = {}
    ) => {
      // Check if we have cached data that's still valid
      const now = Date.now();
      const isCacheValid =
        !options.skipCache &&
        state.lastUpdated &&
        now - state.lastUpdated < mergedOptions.cacheTime!;

      if (isCacheValid && state.data) {
        return state.data;
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await apiCall();

        // Check if the API response indicates an error
        if (response.data && response.data.success === false) {
          const errorMsg =
            response.data.message ||
            response.data.error ||
            mergedOptions.errorMessage;
          throw new Error(errorMsg);
        }

        const data = options.transform
          ? options.transform(response.data)
          : (response.data as unknown as T);

        setState((prev) => ({
          ...prev,
          data,
          isLoading: false,
          lastUpdated: Date.now(),
        }));

        if (mergedOptions.showSuccessToast) {
          toast.success(mergedOptions.successMessage!);
        }

        if (options.onSuccess) {
          options.onSuccess(response.data);
        }

        return response.data;
      } catch (error) {
        const errorMessage = handleError(error, mergedOptions.errorMessage);

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));

        if (mergedOptions.showErrorToast) {
          toast.error(errorMessage);
        }

        if (options.onError) {
          options.onError(error);
        }

        throw error;
      }
    },
    [handleError, state.data, state.lastUpdated, mergedOptions]
  );

  /**
   * Reset the service state
   */
  const reset = useCallback(() => {
    setState({
      data: initialData,
      isLoading: false,
      error: null,
      lastUpdated: null,
    });
  }, [initialData]);

  /**
   * Refresh data by forcing a re-fetch
   */
  const refresh = useCallback(
    async (apiCall: () => Promise<{ data: any }>) => {
      return execute(apiCall, { skipCache: true });
    },
    [execute]
  );

  return {
    ...state,
    execute,
    reset,
    refresh,
    // Helper to check if data exists and is not loading
    isReady: !state.isLoading && state.data !== null,
  };
}
