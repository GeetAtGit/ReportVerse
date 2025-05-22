// @ts-nocheck - Type checking disabled due to issues with useFieldArray and React Hook Form
"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  useForm,
  useFieldArray,
  Controller,
  FieldArrayWithId,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { menteeApi } from "@/services/api";
import {
  AcademicCapIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  XMarkIcon,
  ExclamationCircleIcon,
  CloudArrowUpIcon,
  GlobeAltIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

// Define schema based on AcademicRecord model
const academicsSchema = z.object({
  semesterGPA: z.array(
    z.object({
      semester: z
        .number()
        .min(1, "Semester must be at least 1")
        .max(12, "Semester cannot exceed 12"),
      gpa: z
        .number()
        .min(0, "GPA must be at least 0")
        .max(10, "GPA cannot exceed 10"),
    })
  ),
  moocCourses: z.array(z.string().min(1, "Course name is required")),
  certifications: z.array(z.string().min(1, "Certification name is required")),
  backlogs: z.number().min(0, "Backlogs cannot be negative"),
  semesterMarksheets: z
    .array(
      z.object({
        semester: z.number().min(1, "Semester must be at least 1"),
        imageUrl: z.string().optional(),
      })
    )
    .optional(),
});

type AcademicsFormData = z.infer<typeof academicsSchema>;

export default function AcademicsPage() {
  const [editMode, setEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [academicDataExists, setAcademicDataExists] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<{
    [key: number]: File | null;
  }>({});
  const [previewUrls, setPreviewUrls] = useState<{ [key: number]: string }>({});
  const [isUploading, setIsUploading] = useState(false);

  // Initialize form with react-hook-form
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AcademicsFormData>({
    resolver: zodResolver(academicsSchema),
    defaultValues: {
      semesterGPA: [],
      moocCourses: [],
      certifications: [],
      backlogs: 0,
      semesterMarksheets: [],
    },
  });

  // Initialize field arrays for dynamic form fields
  const semesterGPAArray = useFieldArray({
    control,
    name: "semesterGPA",
  });

  // @ts-ignore - TypeScript issue with field paths
  const moocCoursesArray = useFieldArray({
    control,
    name: "moocCourses",
  });

  // @ts-ignore - TypeScript issue with field paths
  const certificationsArray = useFieldArray({
    control,
    name: "certifications",
  });

  // Load academic data on mount
  useEffect(() => {
    loadAcademicData();
  }, []);

  // Function to load academic data
  async function loadAcademicData() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await menteeApi.getAcademics();

      // Extract academic data from response
      const academicData = response.data.data;

      // Format and set form data
      reset({
        semesterGPA: academicData.semesterGPA || [],
        moocCourses: academicData.moocCourses || [],
        certifications: academicData.certifications || [],
        backlogs: academicData.backlogs || 0,
        semesterMarksheets: academicData.semesterMarksheets || [],
      });

      // Set preview URLs for existing marksheets
      const previews: { [key: number]: string } = {};
      academicData.semesterMarksheets?.forEach((marksheet: any) => {
        if (marksheet.imageUrl) {
          previews[marksheet.semester] = marksheet.imageUrl;
        }
      });
      setPreviewUrls(previews);

      setAcademicDataExists(true);
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Handle 404 - academic record doesn't exist yet
        setAcademicDataExists(false);
        reset({
          semesterGPA: [],
          moocCourses: [],
          certifications: [],
          backlogs: 0,
          semesterMarksheets: [],
        });
        // No need to show error for 404
      } else {
        setError("Failed to load academic data. Please try again.");
        toast.error("Error loading academic data");
        console.error("Academic load error:", error);
      }
    } finally {
      setIsLoading(false);
    }
  }

  // Handle file change for marksheets
  const handleFileChange = (semester: number, file: File | null) => {
    setSelectedFiles((prev) => ({
      ...prev,
      [semester]: file,
    }));

    if (file) {
      // Check if file is too large (5MB limit)
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`File is too large. Maximum size is 5MB.`);
        return;
      }

      // Check file type
      if (
        !["image/jpeg", "image/png", "image/gif", "image/webp"].includes(
          file.type
        )
      ) {
        toast.error("Only image files (JPEG, PNG, GIF, WebP) are supported.");
        return;
      }

      console.log(
        `Processing image for semester ${semester}: ${file.name} (${file.size} bytes)`
      );

      const reader = new FileReader();

      reader.onloadend = () => {
        try {
          // Create a placeholder for the image to show it's processing
          setPreviewUrls((prev) => ({
            ...prev,
            [semester]: reader.result as string,
          }));

          // Create an image for compression
          const img = new Image();
          img.onload = () => {
            try {
              // Create a canvas to resize the image
              const canvas = document.createElement("canvas");

              // Set max dimensions for the image (to reduce size)
              const MAX_WIDTH = 800;
              const MAX_HEIGHT = 800;

              let width = img.width;
              let height = img.height;

              // Maintain aspect ratio while resizing
              if (width > height) {
                if (width > MAX_WIDTH) {
                  height *= MAX_WIDTH / width;
                  width = MAX_WIDTH;
                }
              } else {
                if (height > MAX_HEIGHT) {
                  width *= MAX_HEIGHT / height;
                  height = MAX_HEIGHT;
                }
              }

              // Set canvas dimensions
              canvas.width = width;
              canvas.height = height;

              // Draw image on canvas
              const ctx = canvas.getContext("2d");
              if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);

                // Get compressed image data (0.85 quality)
                const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.85);

                // Update preview with compressed image
                setPreviewUrls((prev) => ({
                  ...prev,
                  [semester]: compressedDataUrl,
                }));

                console.log(
                  `Image for semester ${semester} compressed successfully`
                );
              }
            } catch (err) {
              console.error("Error compressing image:", err);
              toast.error(
                "Error processing image. Please try a different file."
              );
            }
          };

          img.onerror = () => {
            console.error("Error loading image for compression");
            toast.error("Error processing image. Please try a different file.");
          };

          // Start the image loading and compression process
          img.src = reader.result as string;
        } catch (err) {
          console.error("Error processing image:", err);
          toast.error(
            "Error processing image. Please try again with a different file."
          );
        }
      };

      reader.onerror = () => {
        console.error("Error reading file");
        toast.error("Error reading file. Please try again.");
      };

      reader.readAsDataURL(file);
    }
  };

  // Handle form submission
  const onSubmit = async (data: AcademicsFormData) => {
    try {
      setIsUploading(true);

      // Create an array for the semester marksheets
      let semesterMarksheets = [...(data.semesterMarksheets || [])];

      // Update marksheets with selected files
      for (const [semesterStr, file] of Object.entries(selectedFiles)) {
        if (!file) continue;

        const semester = parseInt(semesterStr);
        // In a real app, you would upload the file to a server here
        // and get back a URL to store. For this demo, we'll use the data URL
        // that we created in handleFileChange
        const imageUrl = previewUrls[semester];

        // Find if this semester already exists in the marksheets
        const existingIndex = semesterMarksheets.findIndex(
          (m) => m.semester === semester
        );

        if (existingIndex >= 0) {
          // Update existing marksheet
          semesterMarksheets[existingIndex].imageUrl = imageUrl;
        } else {
          // Add new marksheet
          semesterMarksheets.push({
            semester,
            imageUrl,
          });
        }
      }

      // Create the payload for the API call
      const payload = {
        ...data,
        semesterMarksheets,
      };

      // Send the update to the API
      await menteeApi.updateAcademics(payload);

      // Show success message
      toast.success("Academic records updated successfully");

      // Update local state and exit edit mode
      setAcademicDataExists(true);
      setEditMode(false);

      // Clear selected files
      setSelectedFiles({});

      // Refresh data to ensure we have the latest from server
      loadAcademicData();
    } catch (error) {
      toast.error("Failed to save academic data");
      console.error("Academic save error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle cancel button click
  const handleCancel = () => {
    setEditMode(false);
    setSelectedFiles({});
    loadAcademicData(); // Reload data to reset form
  };

  // Helper functions for adding items to arrays
  const addNewGPA = () => {
    semesterGPAArray.append({ semester: 1, gpa: 0 });
  };

  const addNewMOOC = () => {
    // @ts-ignore - TypeScript issue with append
    moocCoursesArray.append("");
  };

  const addNewCertification = () => {
    // @ts-ignore - TypeScript issue with append
    certificationsArray.append("");
  };

  // Helper function to safely get field value from field array objects
  const getFieldValue = (field: FieldArrayWithId | any) => {
    // Handle field array objects - extract the actual value instead of rendering the object
    if (field && typeof field === "object" && "id" in field) {
      // For simple string arrays, the value is often in field[0]
      if ("0" in field && typeof field[0] === "string") {
        return field[0];
      }
      // Try to return a meaningful value or empty string as fallback
      return "";
    }
    // If it's already a string, return as is
    return String(field || "");
  };

  return (
    <div className="space-y-6">
      {/* Header with title and action buttons */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Academic Records</h1>
        <div>
          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition"
              disabled={isLoading}
            >
              {academicDataExists ? "Edit Academics" : "Add Academics"}
            </button>
          ) : (
            <div className="space-x-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
                disabled={isSubmitting || isUploading}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit(onSubmit)}
                className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition"
                disabled={isSubmitting || isUploading}
              >
                {isSubmitting || isUploading ? "Saving..." : "Save"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      ) : error ? (
        // Error state
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
          <p className="flex items-center">
            <ExclamationCircleIcon className="h-5 w-5 mr-2" />
            {error}
          </p>
          <button
            onClick={loadAcademicData}
            className="mt-4 px-4 py-2 bg-white border border-red-300 text-red-700 rounded hover:bg-red-50 transition"
          >
            Try Again
          </button>
        </div>
      ) : (
        // Academic record form/display
        <div className="space-y-6">
          {/* Semester GPA Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center">
                <AcademicCapIcon className="w-5 h-5 mr-2 text-primary" />
                Semester GPAs
              </h2>
              {editMode && (
                <button
                  type="button"
                  onClick={addNewGPA}
                  className="flex items-center text-sm bg-primary text-white px-3 py-1.5 rounded hover:bg-primary/90 transition"
                >
                  <PlusIcon className="w-4 h-4 mr-1" />
                  Add Semester GPA
                </button>
              )}
            </div>

            {semesterGPAArray.fields.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                        Semester
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                        GPA
                      </th>
                      {editMode && (
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">
                          Action
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {semesterGPAArray.fields.map((field, index) => (
                      <tr key={field.id} className="border-t border-gray-200">
                        <td className="px-4 py-3">
                          {editMode ? (
                            <div>
                              <Controller
                                control={control}
                                name={`semesterGPA.${index}.semester`}
                                render={({ field }) => (
                                  <input
                                    {...field}
                                    type="number"
                                    min="1"
                                    max="12"
                                    onChange={(e) =>
                                      field.onChange(parseInt(e.target.value))
                                    }
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-primary/50"
                                  />
                                )}
                              />
                              {errors.semesterGPA?.[index]?.semester && (
                                <p className="mt-1 text-sm text-red-500">
                                  {errors.semesterGPA[index]?.semester?.message}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span>Semester {field.semester}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {editMode ? (
                            <div>
                              <Controller
                                control={control}
                                name={`semesterGPA.${index}.gpa`}
                                render={({ field }) => (
                                  <input
                                    {...field}
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="10"
                                    onChange={(e) =>
                                      field.onChange(parseFloat(e.target.value))
                                    }
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-primary/50"
                                  />
                                )}
                              />
                              {errors.semesterGPA?.[index]?.gpa && (
                                <p className="mt-1 text-sm text-red-500">
                                  {errors.semesterGPA[index]?.gpa?.message}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span>{field.gpa.toFixed(2)}</span>
                          )}
                        </td>
                        {editMode && (
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => semesterGPAArray.remove(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                <AcademicCapIcon className="w-10 h-10 mx-auto text-gray-400" />
                <p className="mt-2 text-gray-500">
                  No semester GPA records added yet.
                </p>
                {editMode && (
                  <button
                    type="button"
                    onClick={addNewGPA}
                    className="mt-4 bg-white border border-primary text-primary px-4 py-2 rounded hover:bg-primary hover:text-white transition"
                  >
                    Add First Semester GPA
                  </button>
                )}
              </div>
            )}
          </div>

          {/* MOOC Courses Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center">
                <GlobeAltIcon className="w-5 h-5 mr-2 text-primary" />
                MOOC Courses
              </h2>
              {editMode && (
                <button
                  type="button"
                  onClick={addNewMOOC}
                  className="flex items-center text-sm bg-primary text-white px-3 py-1.5 rounded hover:bg-primary/90 transition"
                >
                  <PlusIcon className="w-4 h-4 mr-1" />
                  Add MOOC Course
                </button>
              )}
            </div>

            {moocCoursesArray.fields.length > 0 ? (
              <ul className="space-y-3">
                {moocCoursesArray.fields.map((field, index) => (
                  <li
                    key={field.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                  >
                    {editMode ? (
                      <div className="flex-1 mr-3">
                        <input
                          {...register(`moocCourses.${index}`)}
                          className="w-full p-2 border rounded focus:ring-2 focus:ring-primary/50"
                          placeholder="Enter course name or link"
                        />
                        {errors.moocCourses?.[index] && (
                          <p className="mt-1 text-sm text-red-500">
                            {errors.moocCourses[index]?.message}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="flex-1">
                        <span>{getFieldValue(field)}</span>
                      </div>
                    )}

                    {editMode && (
                      <button
                        type="button"
                        onClick={() => moocCoursesArray.remove(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-6 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                <GlobeAltIcon className="w-10 h-10 mx-auto text-gray-400" />
                <p className="mt-2 text-gray-500">No MOOC courses added yet.</p>
                {editMode && (
                  <button
                    type="button"
                    onClick={addNewMOOC}
                    className="mt-4 bg-white border border-primary text-primary px-4 py-2 rounded hover:bg-primary hover:text-white transition"
                  >
                    Add First MOOC Course
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Certifications Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center">
                <DocumentTextIcon className="w-5 h-5 mr-2 text-primary" />
                Certifications
              </h2>
              {editMode && (
                <button
                  type="button"
                  onClick={addNewCertification}
                  className="flex items-center text-sm bg-primary text-white px-3 py-1.5 rounded hover:bg-primary/90 transition"
                >
                  <PlusIcon className="w-4 h-4 mr-1" />
                  Add Certification
                </button>
              )}
            </div>

            {certificationsArray.fields.length > 0 ? (
              <ul className="space-y-3">
                {certificationsArray.fields.map((field, index) => (
                  <li
                    key={field.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                  >
                    {editMode ? (
                      <div className="flex-1 mr-3">
                        <input
                          {...register(`certifications.${index}`)}
                          className="w-full p-2 border rounded focus:ring-2 focus:ring-primary/50"
                          placeholder="Enter certification name or details"
                        />
                        {errors.certifications?.[index] && (
                          <p className="mt-1 text-sm text-red-500">
                            {errors.certifications[index]?.message}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="flex-1">
                        <span>{getFieldValue(field)}</span>
                      </div>
                    )}

                    {editMode && (
                      <button
                        type="button"
                        onClick={() => certificationsArray.remove(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-6 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                <DocumentTextIcon className="w-10 h-10 mx-auto text-gray-400" />
                <p className="mt-2 text-gray-500">
                  No certifications added yet.
                </p>
                {editMode && (
                  <button
                    type="button"
                    onClick={addNewCertification}
                    className="mt-4 bg-white border border-primary text-primary px-4 py-2 rounded hover:bg-primary hover:text-white transition"
                  >
                    Add First Certification
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Backlogs Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Backlogs</h2>
            <div className="flex items-center">
              <label className="block text-sm font-medium text-gray-700 mr-4">
                Number of Backlogs:
              </label>
              <div className="flex items-center">
                {editMode ? (
                  <Controller
                    control={control}
                    name="backlogs"
                    render={({ field }) => (
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() =>
                            field.onChange(Math.max(0, field.value - 1))
                          }
                          className="px-3 py-1 border border-gray-300 rounded-l bg-gray-200 hover:bg-gray-300 text-gray-700"
                        >
                          -
                        </button>
                        <input
                          value={field.value}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            field.onChange(isNaN(value) ? 0 : value);
                          }}
                          className="w-16 py-1 px-2 text-center border-t border-b border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={() => field.onChange(field.value + 1)}
                          className="px-3 py-1 border border-gray-300 rounded-r bg-gray-200 hover:bg-gray-300 text-gray-700"
                        >
                          +
                        </button>
                      </div>
                    )}
                  />
                ) : (
                  <span className="text-lg font-medium">
                    {control._formValues.backlogs}
                  </span>
                )}
              </div>
              {errors.backlogs && (
                <p className="ml-4 text-sm text-red-500">
                  {errors.backlogs.message}
                </p>
              )}
            </div>
          </div>

          {/* Semester Marksheets Section - Improved UI */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center">
                <CloudArrowUpIcon className="w-5 h-5 mr-2 text-primary" />
                Semester Marksheets
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }, (_, i) => i + 1).map((semester) => (
                <div key={semester} className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Semester {semester}</h3>

                  {previewUrls[semester] ? (
                    <div className="relative">
                      <img
                        src={previewUrls[semester]}
                        alt={`Semester ${semester} marksheet`}
                        className="w-full h-32 object-cover rounded-md mb-2"
                      />
                      {editMode && (
                        <button
                          type="button"
                          onClick={() => {
                            handleFileChange(semester, null);
                            setPreviewUrls((prev) => {
                              const updated = { ...prev };
                              delete updated[semester];
                              return updated;
                            });
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                          title="Remove image"
                          aria-label="Remove image"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-md p-4 flex flex-col items-center justify-center h-32">
                      {selectedFiles[semester] ? (
                        <div className="text-center">
                          <p className="text-sm text-green-600 font-medium">
                            File selected:
                          </p>
                          <p className="text-xs text-gray-500 truncate max-w-[120px]">
                            {selectedFiles[semester]?.name}
                          </p>
                        </div>
                      ) : (
                        <>
                          <CloudArrowUpIcon className="w-8 h-8 text-gray-400" />
                          <p className="text-sm text-gray-500 mt-2">
                            No marksheet
                          </p>
                        </>
                      )}
                    </div>
                  )}

                  {editMode && (
                    <div className="mt-2">
                      <label
                        htmlFor={`marksheet-${semester}`}
                        className="block w-full py-2 px-3 text-sm text-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded cursor-pointer border border-gray-300 transition"
                      >
                        {previewUrls[semester] ? "Change File" : "Select File"}
                      </label>
                      <input
                        id={`marksheet-${semester}`}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files && e.target.files[0];
                          handleFileChange(semester, file || null);
                        }}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
