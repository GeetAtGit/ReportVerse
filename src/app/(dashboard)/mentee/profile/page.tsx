"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { menteeApi } from "@/services/api";
import { useAuth } from "@/lib/auth";
import {
  UserIcon,
  AcademicCapIcon,
  PhoneIcon,
  BuildingLibraryIcon,
  HomeIcon,
  IdentificationIcon,
  UserGroupIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

// Define Zod schema based on MenteeProfile model structure
const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  registrationNo: z.string().min(1, "Registration number is required"),
  section: z.string().optional(),
  rollNo: z.string().optional(),
  branch: z.string().min(1, "Branch is required"),
  mobileNo: z.string().min(10, "Valid mobile number is required"),
  hostelBlockNo: z.string().optional(),
  roomNo: z.string().optional(),
  bloodGroup: z.string().optional(),
  dob: z.string().optional(),
  alumniFamily: z.object({
    status: z.boolean().default(false),
    details: z.string().optional(),
  }),
  fatherDetails: z.object({
    name: z.string().min(1, "Father's name is required"),
    occupation: z
      .enum([
        "Entrepreneur",
        "Family business",
        "Public Sector",
        "Professional",
        "Govt. Employee",
        "Pvt. Company",
        "Other",
      ])
      .optional(),
    organizationDesignation: z.string().optional(),
    mobileNo: z.string().optional(),
    emailId: z.string().email("Invalid email").optional().or(z.literal("")),
  }),
  motherDetails: z.object({
    name: z.string().min(1, "Mother's name is required"),
    occupation: z
      .enum([
        "Home Maker",
        "Entrepreneur",
        "Family business",
        "Public Sector",
        "Professional",
        "Govt. Employee",
        "Pvt. Company",
        "Other",
      ])
      .optional(),
    organizationDesignation: z.string().optional(),
    mobileNo: z.string().optional(),
    emailId: z.string().email("Invalid email").optional().or(z.literal("")),
  }),
  communicationAddress: z.object({
    address: z.string().min(1, "Communication address is required"),
    pinCode: z.string().min(1, "PIN code is required"),
  }),
  permanentAddress: z.object({
    address: z.string().min(1, "Permanent address is required"),
    pinCode: z.string().min(1, "PIN code is required"),
  }),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileExists, setProfileExists] = useState(false);

  // Initialize react-hook-form with zod validation
  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      registrationNo: "",
      section: "",
      rollNo: "",
      branch: "",
      mobileNo: "",
      hostelBlockNo: "",
      roomNo: "",
      bloodGroup: "",
      dob: "",
      alumniFamily: {
        status: false,
        details: "",
      },
      fatherDetails: {
        name: "",
        occupation: undefined,
        organizationDesignation: "",
        mobileNo: "",
        emailId: "",
      },
      motherDetails: {
        name: "",
        occupation: undefined,
        organizationDesignation: "",
        mobileNo: "",
        emailId: "",
      },
      communicationAddress: {
        address: "",
        pinCode: "",
      },
      permanentAddress: {
        address: "",
        pinCode: "",
      },
    },
  });

  // Watch alumni status to conditionally show alumni details
  const alumniStatus = watch("alumniFamily.status");

  // Load profile data on mount
  useEffect(() => {
    loadProfileData();
  }, []);

  // Function to load profile data
  async function loadProfileData() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await menteeApi.getProfile();

      // Extract profile data from response
      const profileData = response.data.data;

      // Format date for form (if exists)
      if (profileData.dob) {
        profileData.dob = new Date(profileData.dob).toISOString().split("T")[0];
      }

      // Reset form with profile data
      reset(profileData);
      setProfileExists(true);
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        // Handle 404 - profile doesn't exist yet
        setProfileExists(false);
        // No need to show error for 404
      } else {
        setError("Failed to load profile data. Please try again.");
        toast.error("Error loading profile data");
        console.error("Profile load error:", error);
      }
    } finally {
      setIsLoading(false);
    }
  }

  // Handle form submission
  const onSubmit = async (data: ProfileFormData) => {
    try {
      // Determine whether to create or update profile
      const apiCall = profileExists
        ? menteeApi.updateProfile(data)
        : menteeApi.createProfile(data);

      const response = await apiCall;

      // Show success message
      toast.success(
        profileExists
          ? "Profile updated successfully"
          : "Profile created successfully"
      );

      // Update user context if profile was created (profile completed)
      if (!profileExists && user) {
        // Update user in auth context if available
        // Note: We don't directly call updateUser as it might not be available in all contexts
        // Instead we'll refresh the page data which should reflect the updated profile state
      }

      // Update local state
      setProfileExists(true);
      setEditMode(false);

      // Refresh data to ensure we have the latest from server
      loadProfileData();
    } catch (error) {
      toast.error("Failed to save profile");
      console.error("Profile save error:", error);
    }
  };

  // Handle cancel button click
  const handleCancel = () => {
    setEditMode(false);
    loadProfileData(); // Reload data to reset form
  };

  // Father's occupation options
  const fatherOccupationOptions = [
    "Entrepreneur",
    "Family business",
    "Public Sector",
    "Professional",
    "Govt. Employee",
    "Pvt. Company",
    "Other",
  ];

  // Mother's occupation options
  const motherOccupationOptions = [
    "Home Maker",
    "Entrepreneur",
    "Family business",
    "Public Sector",
    "Professional",
    "Govt. Employee",
    "Pvt. Company",
    "Other",
  ];

  // Blood group options
  const bloodGroupOptions = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  // Render form field with label and error handling
  const FormField = ({
    label,
    name,
    type = "text",
    required = false,
    options = null,
    icon = null,
    placeholder = "",
    disabled = !editMode,
  }: {
    label: string;
    name: string;
    type?: string;
    required?: boolean;
    options?: { value: string; label: string }[] | null;
    icon?: React.ReactNode;
    placeholder?: string;
    disabled?: boolean;
  }) => {
    // For nested fields like "fatherDetails.name", we need to handle errors differently
    const getNestedError = (path: string) => {
      const parts = path.split(".");
      let error: any = errors;

      for (const part of parts) {
        if (!error || !error[part]) return undefined;
        error = error[part];
      }

      return error.message;
    };

    const errorMessage = getNestedError(name);

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className={`relative ${icon ? "has-icon" : ""}`}>
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {icon}
            </div>
          )}

          {type === "select" && options ? (
            <select
              {...register(name as any)}
              disabled={disabled}
              className={`w-full p-2 ${
                icon ? "pl-10" : ""
              } border rounded focus:ring-2 focus:ring-primary/50 
                ${errorMessage ? "border-red-500" : "border-gray-300"} 
                ${disabled ? "bg-gray-50" : "bg-white"}`}
            >
              <option value="">Select {label}</option>
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : type === "textarea" ? (
            <textarea
              {...register(name as any)}
              disabled={disabled}
              placeholder={placeholder}
              rows={3}
              className={`w-full p-2 ${
                icon ? "pl-10" : ""
              } border rounded focus:ring-2 focus:ring-primary/50 
                ${errorMessage ? "border-red-500" : "border-gray-300"} 
                ${disabled ? "bg-gray-50" : "bg-white"}`}
            />
          ) : type === "checkbox" ? (
            <div className="flex items-center">
              <input
                type="checkbox"
                {...register(name as any)}
                disabled={disabled}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-500">{placeholder}</span>
            </div>
          ) : (
            <input
              type={type}
              {...register(name as any)}
              disabled={disabled}
              placeholder={placeholder}
              className={`w-full p-2 ${
                icon ? "pl-10" : ""
              } border rounded focus:ring-2 focus:ring-primary/50 
                ${errorMessage ? "border-red-500" : "border-gray-300"} 
                ${disabled ? "bg-gray-50" : "bg-white"}`}
            />
          )}

          {errorMessage && (
            <div className="mt-1 flex items-center text-sm text-red-500">
              <ExclamationCircleIcon className="h-4 w-4 mr-1 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with title and action buttons */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Profile Information</h1>
        <div>
          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition"
              disabled={isLoading}
            >
              Edit Profile
            </button>
          ) : (
            <div className="space-x-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit(onSubmit)}
                className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save"}
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
            onClick={loadProfileData}
            className="mt-4 px-4 py-2 bg-white border border-red-300 text-red-700 rounded hover:bg-red-50 transition"
          >
            Try Again
          </button>
        </div>
      ) : (
        // Profile form
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8">
            {/* Basic Information Section */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 flex items-center mb-6 pb-2 border-b">
                <UserIcon className="w-5 h-5 mr-2 text-primary" />
                Basic Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FormField
                  label="Name"
                  name="name"
                  required={true}
                  icon={<UserIcon className="h-5 w-5 text-gray-400" />}
                />

                <FormField
                  label="Registration No."
                  name="registrationNo"
                  required={true}
                  icon={
                    <IdentificationIcon className="h-5 w-5 text-gray-400" />
                  }
                />

                <FormField label="Section" name="section" />

                <FormField label="Roll No." name="rollNo" />

                <FormField
                  label="Branch"
                  name="branch"
                  required={true}
                  icon={<AcademicCapIcon className="h-5 w-5 text-gray-400" />}
                />

                <FormField
                  label="Mobile No."
                  name="mobileNo"
                  type="tel"
                  required={true}
                  icon={<PhoneIcon className="h-5 w-5 text-gray-400" />}
                />

                <FormField
                  label="Hostel Block No."
                  name="hostelBlockNo"
                  icon={
                    <BuildingLibraryIcon className="h-5 w-5 text-gray-400" />
                  }
                />

                <FormField label="Room No." name="roomNo" />

                <FormField
                  label="Blood Group"
                  name="bloodGroup"
                  type="select"
                  options={bloodGroupOptions.map((group) => ({
                    value: group,
                    label: group,
                  }))}
                />

                <FormField label="Date of Birth" name="dob" type="date" />
              </div>
            </div>

            {/* Alumni Family Section */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 flex items-center mb-6 pb-2 border-b">
                <UserGroupIcon className="w-5 h-5 mr-2 text-primary" />
                Alumni Family Information
              </h2>

              <div className="space-y-6">
                <FormField
                  label="Alumni in Family"
                  name="alumniFamily.status"
                  type="checkbox"
                  placeholder="Someone from my family is an alumni of this institution"
                />

                {alumniStatus && (
                  <FormField
                    label="Alumni Details"
                    name="alumniFamily.details"
                    type="textarea"
                    placeholder="Please provide details about the alumni in your family"
                  />
                )}
              </div>
            </div>

            {/* Father's Details Section */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 flex items-center mb-6 pb-2 border-b">
                <UserIcon className="w-5 h-5 mr-2 text-primary" />
                Father's Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Name"
                  name="fatherDetails.name"
                  required={true}
                />

                <FormField
                  label="Occupation"
                  name="fatherDetails.occupation"
                  type="select"
                  options={fatherOccupationOptions.map((occ) => ({
                    value: occ,
                    label: occ,
                  }))}
                />

                <FormField
                  label="Organization & Designation"
                  name="fatherDetails.organizationDesignation"
                />

                <FormField
                  label="Mobile No."
                  name="fatherDetails.mobileNo"
                  type="tel"
                  icon={<PhoneIcon className="h-5 w-5 text-gray-400" />}
                />

                <FormField
                  label="Email"
                  name="fatherDetails.emailId"
                  type="email"
                />
              </div>
            </div>

            {/* Mother's Details Section */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 flex items-center mb-6 pb-2 border-b">
                <UserIcon className="w-5 h-5 mr-2 text-primary" />
                Mother's Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Name"
                  name="motherDetails.name"
                  required={true}
                />

                <FormField
                  label="Occupation"
                  name="motherDetails.occupation"
                  type="select"
                  options={motherOccupationOptions.map((occ) => ({
                    value: occ,
                    label: occ,
                  }))}
                />

                <FormField
                  label="Organization & Designation"
                  name="motherDetails.organizationDesignation"
                />

                <FormField
                  label="Mobile No."
                  name="motherDetails.mobileNo"
                  type="tel"
                  icon={<PhoneIcon className="h-5 w-5 text-gray-400" />}
                />

                <FormField
                  label="Email"
                  name="motherDetails.emailId"
                  type="email"
                />
              </div>
            </div>

            {/* Address Information Section */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 flex items-center mb-6 pb-2 border-b">
                <HomeIcon className="w-5 h-5 mr-2 text-primary" />
                Address Information
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-md font-medium text-gray-800 mb-3">
                    Communication Address
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <FormField
                        label="Address"
                        name="communicationAddress.address"
                        type="textarea"
                        required={true}
                      />
                    </div>

                    <FormField
                      label="PIN Code"
                      name="communicationAddress.pinCode"
                      required={true}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-md font-medium text-gray-800 mb-3">
                    Permanent Address
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <FormField
                        label="Address"
                        name="permanentAddress.address"
                        type="textarea"
                        required={true}
                      />
                    </div>

                    <FormField
                      label="PIN Code"
                      name="permanentAddress.pinCode"
                      required={true}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Form actions for mobile view */}
            {editMode && (
              <div className="pt-6 flex justify-end space-x-3 md:hidden">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save"}
                </button>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
