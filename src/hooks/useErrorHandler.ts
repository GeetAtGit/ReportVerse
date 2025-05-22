"use client";

import { useState, useCallback } from "react";
import { toast } from "react-hot-toast";

interface ErrorState {
  hasError: boolean;
  message: string | null;
  details: any;
}

interface ErrorHandlerOptions {
  logToConsole?: boolean;
  showToast?: boolean;
  reportToService?: boolean;
}

const defaultOptions: ErrorHandlerOptions = {
  logToConsole: true,
  showToast: true,
  reportToService: false,
};

/**
 * Hook for handling errors in components and API calls
 */
export const useErrorHandler = (options: ErrorHandlerOptions = {}) => {
  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    message: null,
    details: null,
  });

  const mergedOptions = { ...defaultOptions, ...options };

  /**
   * Report error to monitoring service
   * This can be expanded to use an actual error monitoring service
   */
  const reportError = useCallback(
    (error: any, source?: string) => {
      if (!mergedOptions.reportToService) return;

      // This would be replaced with an actual error reporting service
      console.log("Error would be reported to monitoring service:", {
        error,
        source,
        timestamp: new Date().toISOString(),
        user:
          typeof window !== "undefined" ? localStorage.getItem("userId") : null,
      });
    },
    [mergedOptions.reportToService]
  );

  /**
   * Handle error from any source
   */
  const handleError = useCallback(
    (error: any, customMessage?: string, source?: string) => {
      // Extract error message
      let message = customMessage || "An unexpected error occurred";

      if (!customMessage) {
        if (typeof error === "string") {
          message = error;
        } else if (error instanceof Error) {
          message = error.message;
        } else if (error?.response?.data?.message) {
          // Handle Axios error
          message = error.response.data.message;
        }
      }

      // Set error state
      setErrorState({
        hasError: true,
        message,
        details: error,
      });

      // Log to console
      if (mergedOptions.logToConsole) {
        console.error(`Error${source ? ` in ${source}` : ""}:`, error);
      }

      // Show toast notification
      if (mergedOptions.showToast) {
        toast.error(message);
      }

      // Report to error monitoring service
      if (mergedOptions.reportToService) {
        reportError(error, source);
      }

      return message;
    },
    [mergedOptions, reportError]
  );

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setErrorState({
      hasError: false,
      message: null,
      details: null,
    });
  }, []);

  /**
   * Wrap a promise with error handling
   */
  const wrapPromise = useCallback(
    async <T>(
      promise: Promise<T>,
      customMessage?: string,
      source?: string
    ): Promise<T> => {
      try {
        return await promise;
      } catch (error) {
        handleError(error, customMessage, source);
        throw error;
      }
    },
    [handleError]
  );

  return {
    ...errorState,
    handleError,
    clearError,
    wrapPromise,
  };
};
