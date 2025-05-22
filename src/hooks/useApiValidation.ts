"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { toast } from "react-hot-toast";

type ValidationStatus = "idle" | "loading" | "error" | "success";

interface ValidationState {
  status: ValidationStatus;
  error: string | null;
  isValid: boolean;
}

/**
 * Hook to validate API access based on user role
 */
export const useApiValidation = () => {
  const { user, isAuthenticated } = useAuth();
  const [validation, setValidation] = useState<ValidationState>({
    status: "idle",
    error: null,
    isValid: false,
  });

  useEffect(() => {
    // Reset validation when user changes
    setValidation({
      status: "idle",
      error: null,
      isValid: false,
    });

    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      setValidation({
        status: "error",
        error: "User not authenticated",
        isValid: false,
      });
      return;
    }

    // Set loading status
    setValidation({
      ...validation,
      status: "loading",
    });

    // Validate based on user role
    if (user.role === "mentee") {
      validateMenteeApi();
    } else if (user.role === "mentor") {
      validateMentorApi();
    } else {
      setValidation({
        status: "error",
        error: "Invalid user role",
        isValid: false,
      });
    }
  }, [user, isAuthenticated]);

  // Validate mentee API access
  const validateMenteeApi = async () => {
    try {
      // Simple test API call to validate access
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/mentee/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setValidation({
        status: "success",
        error: null,
        isValid: true,
      });
    } catch (error) {
      console.error("Mentee API validation failed:", error);

      setValidation({
        status: "error",
        error: "Failed to validate mentee API access",
        isValid: false,
      });

      toast.error("API validation failed. Please try logging in again.");
    }
  };

  // Validate mentor API access
  const validateMentorApi = async () => {
    try {
      // Simple test API call to validate access
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/mentor/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setValidation({
        status: "success",
        error: null,
        isValid: true,
      });
    } catch (error) {
      console.error("Mentor API validation failed:", error);

      setValidation({
        status: "error",
        error: "Failed to validate mentor API access",
        isValid: false,
      });

      toast.error("API validation failed. Please try logging in again.");
    }
  };

  return validation;
};
