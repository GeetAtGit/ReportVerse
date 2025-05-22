"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useForm } from "@/hooks/useForm";
import { useAPIService } from "@/hooks/useAPIService";
import { menteeApi } from "@/services/api";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

// Interface aligned with the backend Achievement model
interface AchievementFormData {
  type: string; // enum: ['Sports', 'Competitive Exam', 'Internship', 'Research Publication', 'Award', 'Cultural Event', 'Technical Event', 'Hackathon', 'Other']
  position: string; // enum: ['1st', '2nd', '3rd', 'Participation', 'Winner', 'Runner-up', 'Completed', 'Published', 'N/A']
  description: string;
  dateOfAchievement: string;
}

export default function AddAchievementPage() {
  const router = useRouter();
  const achievementService = useAPIService();

  const form = useForm<AchievementFormData>({
    initialValues: {
      type: "",
      position: "N/A",
      description: "",
      dateOfAchievement: new Date().toISOString().split("T")[0],
    },
    onSubmit: handleSubmit,
    validate: validateForm,
  });

  function validateForm(values: AchievementFormData) {
    const errors: Record<string, string> = {};

    if (!values.type.trim()) {
      errors.type = "Type is required";
    }

    if (!values.description.trim()) {
      errors.description = "Description is required";
    }

    if (!values.dateOfAchievement) {
      errors.dateOfAchievement = "Date is required";
    } else {
      const selectedDate = new Date(values.dateOfAchievement);
      const today = new Date();

      if (selectedDate > today) {
        errors.dateOfAchievement = "Date cannot be in the future";
      }
    }

    return errors;
  }

  async function handleSubmit(values: AchievementFormData) {
    try {
      await achievementService.execute(
        () => menteeApi.createAchievement(values),
        {
          onSuccess: () => {
            toast.success("Achievement added successfully");
            router.push("/mentee/achievements");
          },
          onError: (error: any) => {
            console.error("Failed to add achievement:", error);
            const errorMessage =
              error.response?.data?.error ||
              error.response?.data?.message ||
              "Failed to report achievement. Please try again.";
            toast.error(errorMessage);
          },
        }
      );
    } catch (error) {
      console.error("Failed to add achievement:", error);
    }
  }

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    form.handleSubmit(e);
  };

  // Options for achievement type dropdown - matches backend enum
  const typeOptions = [
    { value: "", label: "Select achievement type" },
    { value: "Sports", label: "Sports" },
    { value: "Competitive Exam", label: "Competitive Exam" },
    { value: "Internship", label: "Internship" },
    { value: "Research Publication", label: "Research Publication" },
    { value: "Award", label: "Award" },
    { value: "Cultural Event", label: "Cultural Event" },
    { value: "Technical Event", label: "Technical Event" },
    { value: "Hackathon", label: "Hackathon" },
    { value: "Other", label: "Other" },
  ];

  // Options for position dropdown - matches backend enum
  const positionOptions = [
    { value: "N/A", label: "Not Applicable" },
    { value: "1st", label: "1st Place" },
    { value: "2nd", label: "2nd Place" },
    { value: "3rd", label: "3rd Place" },
    { value: "Participation", label: "Participation" },
    { value: "Winner", label: "Winner" },
    { value: "Runner-up", label: "Runner-up" },
    { value: "Completed", label: "Completed" },
    { value: "Published", label: "Published" },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center text-gray-500 hover:text-gray-700 transition"
      >
        <ArrowLeftIcon className="h-4 w-4 mr-1" />
        Back to Achievements
      </button>

      <h1 className="text-2xl font-bold mb-6">Add New Achievement</h1>

      <form onSubmit={handleFormSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="type"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Achievement Type *
          </label>
          <select
            id="type"
            name="type"
            value={form.values.type}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            className={`w-full p-2 border rounded focus:ring-2 focus:ring-primary/50 ${
              form.touched.type && form.errors.type
                ? "border-red-500"
                : "border-gray-300"
            }`}
          >
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {form.touched.type && form.errors.type && (
            <p className="mt-1 text-sm text-red-500">{form.errors.type}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="position"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Position
            </label>
            <select
              id="position"
              name="position"
              value={form.values.position}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              className="w-full p-2 border rounded border-gray-300 focus:ring-2 focus:ring-primary/50"
            >
              {positionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="dateOfAchievement"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Date of Achievement *
            </label>
            <input
              id="dateOfAchievement"
              name="dateOfAchievement"
              type="date"
              value={form.values.dateOfAchievement}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              max={new Date().toISOString().split("T")[0]}
              className={`w-full p-2 border rounded focus:ring-2 focus:ring-primary/50 ${
                form.touched.dateOfAchievement && form.errors.dateOfAchievement
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
            />
            {form.touched.dateOfAchievement &&
              form.errors.dateOfAchievement && (
                <p className="mt-1 text-sm text-red-500">
                  {form.errors.dateOfAchievement}
                </p>
              )}
          </div>
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
            rows={5}
            placeholder="Describe your achievement, why it's significant, and how you accomplished it."
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

        <div className="mt-8 flex justify-end space-x-4">
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
            {form.isSubmitting ? "Submitting..." : "Add Achievement"}
          </button>
        </div>
      </form>
    </div>
  );
}
