"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
  ArrowRightIcon,
  AcademicCapIcon,
  UserGroupIcon,
  CheckCircleIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

// Form validation schema
const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    role: z.enum(["mentor", "mentee"], {
      invalid_type_error: "Please select a role",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register: registerUser, isLoading } = useAuth();
  const router = useRouter();
  const [localRole, setLocalRole] = useState<"mentee" | "mentor">("mentee");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "mentee",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsSubmitting(true);

      // Add the selected role to the submission data
      const submissionData: Record<string, any> = {
        ...data,
        role: localRole,
      };

      // Check if URL has a mentorId query parameter
      const params = new URLSearchParams(window.location.search);
      const mentorId = params.get("mentorId");

      // If mentorId is present and we're registering a mentee, include it
      if (mentorId && localRole === "mentee") {
        submissionData.mentorId = mentorId;
      }

      // Register the user
      await registerUser(submissionData, localRole);

      toast.success(
        `Registration successful! Welcome to ReportVerse as a ${
          localRole === "mentee" ? "Mentee/Student" : "Mentor/Teacher"
        }.`
      );

      // Wait a moment to allow the toast to be seen
      setTimeout(() => {
        router.push(`/${localRole}/dashboard`);
      }, 1000);
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(
        error.response?.data?.error || "Registration failed. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = (role: "mentee" | "mentor") => {
    setLocalRole(role);
    setValue("role", role, { shouldValidate: true });
  };

  const ErrorIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 mr-1.5 flex-shrink-0"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  );

  return (
    <div className="w-full min-h-screen flex justify-center items-center overflow-x-hidden relative px-4 py-10 sm:px-6 sm:py-16">
      {/* Animated gradient background */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 animate-gradient-background"
        style={{ backgroundSize: "400% 400%" }}
        aria-hidden="true"
      ></div>

      {/* Contained animated blobs */}
      <div
        className="absolute max-w-full top-20 left-[5%] w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"
        aria-hidden="true"
      ></div>
      <div
        className="absolute max-w-full top-20 right-[5%] w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"
        aria-hidden="true"
      ></div>
      <div
        className="absolute max-w-full bottom-20 left-[25%] w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"
        aria-hidden="true"
      ></div>

      {/* Registration card container */}
      <div className="w-full max-w-2xl mx-auto z-10">
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden border border-white/20">
          {/* Card header */}
          <div className="bg-gradient-to-r from-primary to-primary/90 text-white p-7 sm:p-10 text-center">
            <div className="mx-auto h-16 w-16 bg-white/20 rounded-full flex items-center justify-center mb-5 shadow-inner">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              Create your ReportVerse account
            </h1>
            <p className="text-white/90 text-sm sm:text-base">
              Join our platform today
            </p>
          </div>

          {/* Form section */}
          <div className="p-7 sm:p-10 space-y-8">
            <form
              className="space-y-6"
              onSubmit={handleSubmit(onSubmit)}
              noValidate
            >
              {/* Name field */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <UserIcon
                      className="h-5 w-5 text-gray-500"
                      aria-hidden="true"
                    />
                  </div>
                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    {...register("name")}
                    className={`pl-12 appearance-none rounded-lg relative block w-full px-4 py-3.5 border ${
                      errors.name
                        ? "border-red-300 focus:ring-red-500"
                        : "border-gray-300 focus:ring-primary"
                    } placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition-all shadow-sm`}
                    placeholder="Your full name"
                    disabled={isSubmitting}
                    aria-invalid={errors.name ? "true" : "false"}
                    aria-describedby={errors.name ? "name-error" : undefined}
                  />
                </div>
                {errors.name && (
                  <p
                    id="name-error"
                    className="mt-2 text-sm text-red-600 flex items-start"
                  >
                    <ErrorIcon />
                    <span>{errors.name.message}</span>
                  </p>
                )}
              </div>

              {/* Email field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <EnvelopeIcon
                      className="h-5 w-5 text-gray-500"
                      aria-hidden="true"
                    />
                  </div>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    {...register("email")}
                    className={`pl-12 appearance-none rounded-lg relative block w-full px-4 py-3.5 border ${
                      errors.email
                        ? "border-red-300 focus:ring-red-500"
                        : "border-gray-300 focus:ring-primary"
                    } placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition-all shadow-sm`}
                    placeholder="you@example.com"
                    disabled={isSubmitting}
                    aria-invalid={errors.email ? "true" : "false"}
                    aria-describedby={errors.email ? "email-error" : undefined}
                  />
                </div>
                {errors.email && (
                  <p
                    id="email-error"
                    className="mt-2 text-sm text-red-600 flex items-start"
                  >
                    <ErrorIcon />
                    <span>{errors.email.message}</span>
                  </p>
                )}
              </div>

              {/* Phone field */}
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <PhoneIcon
                      className="h-5 w-5 text-gray-500"
                      aria-hidden="true"
                    />
                  </div>
                  <input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    {...register("phone")}
                    className={`pl-12 appearance-none rounded-lg relative block w-full px-4 py-3.5 border ${
                      errors.phone
                        ? "border-red-300 focus:ring-red-500"
                        : "border-gray-300 focus:ring-primary"
                    } placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition-all shadow-sm`}
                    placeholder="Your phone number"
                    disabled={isSubmitting}
                    aria-invalid={errors.phone ? "true" : "false"}
                    aria-describedby={errors.phone ? "phone-error" : undefined}
                  />
                </div>
                {errors.phone && (
                  <p
                    id="phone-error"
                    className="mt-2 text-sm text-red-600 flex items-start"
                  >
                    <ErrorIcon />
                    <span>{errors.phone.message}</span>
                  </p>
                )}
              </div>

              {/* Password fields - 2 column on larger screens */}
              <div className="grid gap-6 sm:grid-cols-2">
                {/* Password field */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <LockClosedIcon
                        className="h-5 w-5 text-gray-500"
                        aria-hidden="true"
                      />
                    </div>
                    <input
                      id="password"
                      type="password"
                      autoComplete="new-password"
                      {...register("password")}
                      className={`pl-12 appearance-none rounded-lg relative block w-full px-4 py-3.5 border ${
                        errors.password
                          ? "border-red-300 focus:ring-red-500"
                          : "border-gray-300 focus:ring-primary"
                      } placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition-all shadow-sm`}
                      placeholder="••••••••"
                      disabled={isSubmitting}
                      aria-invalid={errors.password ? "true" : "false"}
                      aria-describedby={
                        errors.password ? "password-error" : undefined
                      }
                    />
                  </div>
                  {errors.password && (
                    <p
                      id="password-error"
                      className="mt-2 text-sm text-red-600 flex items-start"
                    >
                      <ErrorIcon />
                      <span>{errors.password.message}</span>
                    </p>
                  )}
                </div>

                {/* Confirm Password field */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <LockClosedIcon
                        className="h-5 w-5 text-gray-500"
                        aria-hidden="true"
                      />
                    </div>
                    <input
                      id="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      {...register("confirmPassword")}
                      className={`pl-12 appearance-none rounded-lg relative block w-full px-4 py-3.5 border ${
                        errors.confirmPassword
                          ? "border-red-300 focus:ring-red-500"
                          : "border-gray-300 focus:ring-primary"
                      } placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition-all shadow-sm`}
                      placeholder="••••••••"
                      disabled={isSubmitting}
                      aria-invalid={errors.confirmPassword ? "true" : "false"}
                      aria-describedby={
                        errors.confirmPassword
                          ? "confirm-password-error"
                          : undefined
                      }
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p
                      id="confirm-password-error"
                      className="mt-2 text-sm text-red-600 flex items-start"
                    >
                      <ErrorIcon />
                      <span>{errors.confirmPassword.message}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Role selection */}
              <div className="mt-6">
                <fieldset className="border border-gray-200 rounded-xl p-5 bg-gray-50/50">
                  <legend className="block text-sm font-medium text-gray-700 px-2 -ml-2">
                    I am a
                  </legend>
                  <div className="space-y-4">
                    <div
                      className={`border rounded-xl shadow-sm overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                        localRole === "mentee"
                          ? "bg-blue-50 border-blue-300 ring-2 ring-blue-500"
                          : "bg-white border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => handleRoleChange("mentee")}
                    >
                      <div className="flex items-start p-4">
                        <div className="flex items-center h-5 mt-1">
                          <input
                            id="role-mentee"
                            type="radio"
                            value="mentee"
                            checked={localRole === "mentee"}
                            onChange={() => handleRoleChange("mentee")}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            disabled={isSubmitting}
                          />
                          <input
                            type="hidden"
                            {...register("role")}
                            value={localRole}
                          />
                        </div>
                        <div className="ml-3 flex-1">
                          <label
                            htmlFor="role-mentee"
                            className="block cursor-pointer"
                          >
                            <div className="flex items-center">
                              <div className="bg-blue-100 p-2.5 rounded-full mr-3">
                                <AcademicCapIcon
                                  className="h-6 w-6 text-blue-600"
                                  aria-hidden="true"
                                />
                              </div>
                              <div>
                                <span className="block text-base font-medium text-gray-900">
                                  Mentee / Student
                                </span>
                                <span className="block text-sm text-gray-600 mt-0.5">
                                  I want to be mentored and track my progress
                                </span>
                              </div>
                              {localRole === "mentee" && (
                                <div className="ml-auto">
                                  <CheckCircleIcon
                                    className="h-6 w-6 text-blue-500"
                                    aria-hidden="true"
                                  />
                                </div>
                              )}
                            </div>
                          </label>
                        </div>
                      </div>
                      {localRole === "mentee" && (
                        <div className="bg-blue-500 h-1.5 w-full"></div>
                      )}
                    </div>

                    <div
                      className={`border rounded-xl shadow-sm overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                        localRole === "mentor"
                          ? "bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500"
                          : "bg-white border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => handleRoleChange("mentor")}
                    >
                      <div className="flex items-start p-4">
                        <div className="flex items-center h-5 mt-1">
                          <input
                            id="role-mentor"
                            type="radio"
                            value="mentor"
                            checked={localRole === "mentor"}
                            onChange={() => handleRoleChange("mentor")}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                            disabled={isSubmitting}
                          />
                        </div>
                        <div className="ml-3 flex-1">
                          <label
                            htmlFor="role-mentor"
                            className="block cursor-pointer"
                          >
                            <div className="flex items-center">
                              <div className="bg-indigo-100 p-2.5 rounded-full mr-3">
                                <UserGroupIcon
                                  className="h-6 w-6 text-indigo-600"
                                  aria-hidden="true"
                                />
                              </div>
                              <div>
                                <span className="block text-base font-medium text-gray-900">
                                  Mentor / Teacher
                                </span>
                                <span className="block text-sm text-gray-600 mt-0.5">
                                  I want to mentor students and track their
                                  progress
                                </span>
                              </div>
                              {localRole === "mentor" && (
                                <div className="ml-auto">
                                  <CheckCircleIcon
                                    className="h-6 w-6 text-indigo-500"
                                    aria-hidden="true"
                                  />
                                </div>
                              )}
                            </div>
                          </label>
                        </div>
                      </div>
                      {localRole === "mentor" && (
                        <div className="bg-indigo-500 h-1.5 w-full"></div>
                      )}
                    </div>
                  </div>
                  {errors.role && (
                    <p className="mt-2 text-sm text-red-600 flex items-start">
                      <ErrorIcon />
                      <span>{errors.role.message}</span>
                    </p>
                  )}
                </fieldset>
              </div>

              {/* Submit button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group relative w-full flex justify-center py-3.5 px-6 border border-transparent text-base font-medium rounded-lg text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 shadow-md"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Creating account...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      Create Account
                      <ArrowRightIcon
                        className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform"
                        aria-hidden="true"
                      />
                    </div>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 text-center">
              <p className="text-xs text-gray-500 mb-4">
                By creating an account, you agree to our{" "}
                <Link
                  href="/terms"
                  className="font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Privacy Policy
                </Link>
              </p>
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
