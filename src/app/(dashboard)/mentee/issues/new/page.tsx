"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useForm } from "@/hooks/useForm";
import { useAPIService } from "@/hooks/useAPIService";
import { menteeApi } from "@/services/api";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

// Interface aligned with the backend Issue model
interface IssueFormData {
  issueType: string; // enum: ['Academic', 'Grievances', 'Ragging', 'Harassment', 'Accommodation', 'Other']
  description: string;
}

export default function ReportIssuePage() {
  const router = useRouter();
  const issueService = useAPIService();

  const form = useForm<IssueFormData>({
    initialValues: {
      issueType: "",
      description: "",
    },
    onSubmit: handleSubmit,
    validate: validateForm,
  });

  function validateForm(values: IssueFormData) {
    const errors: Record<string, string> = {};

    if (!values.issueType) {
      errors.issueType = "Issue type is required";
    }

    if (!values.description.trim()) {
      errors.description = "Description is required";
    } else if (values.description.length < 20) {
      errors.description =
        "Please provide a more detailed description (at least 20 characters)";
    }

    return errors;
  }

  async function handleSubmit(values: IssueFormData) {
    try {
      await issueService.execute(() => menteeApi.createIssue(values), {
        onSuccess: () => {
          toast.success("Issue reported successfully");
          router.push("/mentee/issues");
        },
      });
    } catch (error) {
      console.error("Failed to create issue:", error);
    }
  }

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    form.handleSubmit(e);
  };

  // Options for issue type dropdown - matches backend enum
  const issueTypeOptions = [
    { value: "", label: "Select an issue type" },
    { value: "Academic", label: "Academic" },
    { value: "Grievances", label: "Grievances" },
    { value: "Ragging", label: "Ragging" },
    { value: "Harassment", label: "Harassment" },
    { value: "Accommodation", label: "Accommodation" },
    { value: "Other", label: "Other" },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center text-gray-500 hover:text-gray-700 transition"
      >
        <ArrowLeftIcon className="h-4 w-4 mr-1" />
        Back to Issues
      </button>

      <h1 className="text-2xl font-bold mb-6">Report a New Issue</h1>

      <form onSubmit={handleFormSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="issueType"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Issue Type *
          </label>
          <select
            id="issueType"
            name="issueType"
            value={form.values.issueType}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            className={`w-full p-2 border rounded focus:ring-2 focus:ring-primary/50 ${
              form.touched.issueType && form.errors.issueType
                ? "border-red-500"
                : "border-gray-300"
            }`}
          >
            {issueTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {form.touched.issueType && form.errors.issueType && (
            <p className="mt-1 text-sm text-red-500">{form.errors.issueType}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            value={form.values.description}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            rows={6}
            placeholder="Please provide a detailed description of the issue. Include what happened, when it happened, and any other relevant information."
            className={`w-full p-2 border rounded focus:ring-2 focus:ring-primary/50 ${
              form.touched.description && form.errors.description
                ? "border-red-500"
                : "border-gray-300"
            }`}
          />
          {form.touched.description && form.errors.description && (
            <p className="mt-1 text-sm text-red-500">
              {form.errors.description}
            </p>
          )}
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={form.isSubmitting}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition"
          >
            {form.isSubmitting ? "Submitting..." : "Report Issue"}
          </button>
        </div>
      </form>
    </div>
  );
}
