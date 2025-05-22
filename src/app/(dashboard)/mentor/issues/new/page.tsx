"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "react-hot-toast";
import { mentorApi } from "@/services/api";
import {
  ArrowLeftIcon,
  UserIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon,
  HomeIcon,
  ChatBubbleBottomCenterTextIcon,
  EllipsisHorizontalCircleIcon,
} from "@heroicons/react/24/outline";
import { showToast, trackPromise } from "@/components/ui/CustomToasts";

// Form validation schema
const issueSchema = z.object({
  menteeId: z.string().min(1, "Please select a mentee"),
  issueType: z.enum(
    [
      "Academic",
      "Grievances",
      "Ragging",
      "Harassment",
      "Accommodation",
      "Other",
    ],
    {
      required_error: "Please select an issue type",
    }
  ),
  description: z.string().min(20, "Description must be at least 20 characters"),
});

type IssueFormValues = z.infer<typeof issueSchema>;

export default function NewIssuePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mentees, setMentees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize form
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<IssueFormValues>({
    resolver: zodResolver(issueSchema),
    defaultValues: {
      issueType: "Academic",
      description: "",
    },
  });

  const selectedIssueType = watch("issueType");

  // Fetch mentees on component mount
  useEffect(() => {
    async function fetchMentees() {
      setLoading(true);
      try {
        const response = await mentorApi.getMentees();
        setMentees(response.data.data || []);
      } catch (error) {
        console.error("Failed to load mentees:", error);
        toast.error("Failed to load mentees list");
      } finally {
        setLoading(false);
      }
    }

    fetchMentees();
  }, []);

  // Issue type options with icons
  const issueTypeOptions = [
    {
      value: "Academic",
      label: "Academic",
      icon: <AcademicCapIcon className="w-5 h-5" />,
      description: "Issues related to courses, grades, or academic performance",
    },
    {
      value: "Grievances",
      label: "Grievances",
      icon: <ChatBubbleBottomCenterTextIcon className="w-5 h-5" />,
      description:
        "Complaints or concerns about university services or policies",
    },
    {
      value: "Ragging",
      label: "Ragging",
      icon: <ExclamationTriangleIcon className="w-5 h-5" />,
      description: "Incidents of hazing or bullying by seniors",
    },
    {
      value: "Harassment",
      label: "Harassment",
      icon: <ExclamationTriangleIcon className="w-5 h-5" />,
      description: "Any form of harassment or discrimination",
    },
    {
      value: "Accommodation",
      label: "Accommodation",
      icon: <HomeIcon className="w-5 h-5" />,
      description: "Issues related to hostels or living arrangements",
    },
    {
      value: "Other",
      label: "Other",
      icon: <EllipsisHorizontalCircleIcon className="w-5 h-5" />,
      description: "Any other issues not listed above",
    },
  ];

  // Form submission handler
  const onSubmit = async (data: IssueFormValues) => {
    setIsSubmitting(true);
    console.log("Submitting issue:", data);

    try {
      // Call the API to create a new issue
      const response = await trackPromise(
        mentorApi.createIssue({
          menteeId: data.menteeId,
          issueType: data.issueType,
          description: data.description,
        }),
        {
          loading: "Creating issue...",
          success: "Issue created successfully",
          error: "Failed to create issue",
          errorDetails: "Please try again.",
        }
      );

      console.log("Issue creation response:", response.data);
      router.push("/mentor/issues");
    } catch (error) {
      console.error("Failed to create issue:", error);
      // Error handling is done by trackPromise
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <button
          onClick={() => router.push("/mentor/issues")}
          className="mr-4 flex items-center text-gray-500 hover:text-gray-700 transition"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Issues
        </button>
        <h1 className="text-2xl font-bold">Create New Issue</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <div className="space-y-6">
            {/* Mentee Selection */}
            <div>
              <label
                htmlFor="menteeId"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Select Mentee
              </label>
              <select
                id="menteeId"
                {...register("menteeId")}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary ${
                  errors.menteeId ? "border-red-300" : ""
                }`}
                disabled={isSubmitting || mentees.length === 0}
              >
                <option value="">Select a mentee</option>
                {mentees.map((mentee) => (
                  <option key={mentee.id} value={mentee.id}>
                    {mentee.name || mentee.email}
                  </option>
                ))}
              </select>
              {errors.menteeId && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.menteeId.message}
                </p>
              )}
              {mentees.length === 0 && !loading && (
                <p className="mt-1 text-sm text-amber-600">
                  No mentees assigned to you. Please assign mentees first.
                </p>
              )}
            </div>

            {/* Issue Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Issue Type
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {issueTypeOptions.map((option) => (
                  <div key={option.value} className="relative">
                    <input
                      type="radio"
                      id={option.value}
                      value={option.value}
                      {...register("issueType")}
                      className="sr-only"
                    />
                    <label
                      htmlFor={option.value}
                      className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedIssueType === option.value
                          ? "bg-primary/5 border-primary text-primary"
                          : "bg-white border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex-shrink-0 mr-3">{option.icon}</div>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {option.description}
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
              {errors.issueType && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.issueType.message}
                </p>
              )}
            </div>

            {/* Issue Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description
              </label>
              <textarea
                id="description"
                {...register("description")}
                rows={6}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary ${
                  errors.description ? "border-red-300" : ""
                }`}
                placeholder="Describe the issue in detail..."
                disabled={isSubmitting}
              ></textarea>
              {errors.description ? (
                <p className="mt-1 text-sm text-red-600">
                  {errors.description.message}
                </p>
              ) : (
                <p className="mt-1 text-xs text-gray-500">
                  Please provide details about the issue. Minimum 20 characters.
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || mentees.length === 0}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition disabled:opacity-50 flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <span className="mr-2">Creating...</span>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white"></div>
                  </>
                ) : (
                  "Create Issue"
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
