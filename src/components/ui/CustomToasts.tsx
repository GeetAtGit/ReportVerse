"use client";

import { useState, useEffect } from "react";
import { toast, Toast } from "react-hot-toast";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

// Custom toast styles
const baseToastStyles = {
  borderRadius: "8px",
  padding: "0",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
  maxWidth: "420px",
  width: "100%",
};

interface ToastProps {
  t: Toast;
  message: string;
  type: "success" | "error" | "info";
  details?: string;
}

const ToastContent = ({ t, message, type, details }: ToastProps) => {
  // Color schemes for different toast types
  const styles = {
    success: {
      bg: "bg-green-50",
      border: "border-green-200",
      icon: <CheckCircleIcon className="w-6 h-6 text-green-500" />,
      title: "text-green-800",
      detail: "text-green-600",
    },
    error: {
      bg: "bg-red-50",
      border: "border-red-200",
      icon: <ExclamationCircleIcon className="w-6 h-6 text-red-500" />,
      title: "text-red-800",
      detail: "text-red-600",
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      icon: <InformationCircleIcon className="w-6 h-6 text-blue-500" />,
      title: "text-blue-800",
      detail: "text-blue-600",
    },
  };

  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fade-out animation 300ms before actual dismissal
    const timer = setTimeout(
      () => {
        setFadeOut(true);
      },
      t.duration ? t.duration - 300 : 4700
    );

    return () => clearTimeout(timer);
  }, [t.duration]);

  return (
    <div
      className={`${styles[type].bg} ${
        styles[type].border
      } border rounded-lg overflow-hidden transition-opacity duration-300 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
      style={baseToastStyles}
    >
      <div className="flex items-start p-4">
        <div className="flex-shrink-0 mr-3">{styles[type].icon}</div>

        <div className="flex-1 min-w-0 pt-0.5">
          <p className={`text-sm font-medium ${styles[type].title}`}>
            {message}
          </p>
          {details && (
            <p className={`mt-1 text-xs ${styles[type].detail}`}>{details}</p>
          )}
        </div>

        <button
          onClick={() => toast.dismiss(t.id)}
          className="ml-4 flex-shrink-0 bg-transparent rounded-md p-1 hover:bg-black/5 transition-colors"
        >
          <XMarkIcon className="w-5 h-5 text-gray-400" />
        </button>
      </div>
    </div>
  );
};

// Helper functions to show different types of toasts
export const showToast = {
  success: (message: string, details?: string) => {
    return toast.custom(
      (t) => (
        <ToastContent
          t={t}
          message={message}
          type="success"
          details={details}
        />
      ),
      { duration: 5000 }
    );
  },

  error: (message: string, details?: string) => {
    return toast.custom(
      (t) => (
        <ToastContent t={t} message={message} type="error" details={details} />
      ),
      { duration: 7000 } // Errors stay a bit longer
    );
  },

  info: (message: string, details?: string) => {
    return toast.custom(
      (t) => (
        <ToastContent t={t} message={message} type="info" details={details} />
      ),
      { duration: 5000 }
    );
  },
};

// Loading toast with promise support
export const showLoadingToast = <T extends unknown>(
  promise: Promise<T>,
  options: {
    loading: string;
    success: string;
    error: string;
    successDetails?: string;
    errorDetails?: string;
  }
) => {
  return toast.promise(
    promise,
    {
      loading: options.loading,
      success: (data) => options.success,
      error: (err) => options.error,
    },
    {
      loading: {
        icon: "🔄",
      },
      success: {
        duration: 5000,
        icon: "✅",
      },
      error: {
        duration: 7000,
        icon: "❌",
      },
    }
  );
};

// Custom promise tracking with our toast components
export const trackPromise = <T extends unknown>(
  promise: Promise<T>,
  options: {
    loading: string;
    success: string;
    error: string;
    successDetails?: string;
    errorDetails?: string;
  }
): Promise<T> => {
  const loadingToastId = toast.loading(options.loading);

  return promise
    .then((result) => {
      toast.dismiss(loadingToastId);
      showToast.success(options.success, options.successDetails);
      return result;
    })
    .catch((err) => {
      toast.dismiss(loadingToastId);

      // Get error message from the error object if available
      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        options.error;

      showToast.error(
        options.error,
        errorMessage !== options.error ? errorMessage : options.errorDetails
      );
      throw err;
    });
};
