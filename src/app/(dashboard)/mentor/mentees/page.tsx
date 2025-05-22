"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { mentorApi } from "@/services/api";
import { useAPIService } from "@/hooks/useAPIService";
import {
  UserIcon,
  EnvelopeIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  UserPlusIcon,
  LinkIcon,
  ClipboardIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { useAuth } from "@/lib/auth";

// Interface aligned with backend response structure
interface Mentee {
  id: string;
  email: string;
  profileCompleted: boolean;
  name: string | null;
  registrationNo: string | null;
  branch: string | null;
}

export default function MenteesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [menteeEmail, setMenteeEmail] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [showInviteLink, setShowInviteLink] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate invitation link with mentorId
  const inviteLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/register?mentorId=${user?.id || ""}`
      : "";

  // Use our enhanced API service hook with caching
  const menteesService = useAPIService<Mentee[]>([], {
    cacheTime: 5 * 60 * 1000, // Cache for 5 minutes
    errorMessage: "Failed to load mentees data",
    showErrorToast: true,
  });

  useEffect(() => {
    fetchMentees();
  }, []);

  // Function to fetch mentees data
  const fetchMentees = async () => {
    try {
      await menteesService.execute(() => mentorApi.getMentees(), {
        transform: (response) => {
          // Extract the data from the response
          return response.data || [];
        },
      });
    } catch (error) {
      console.error("Error fetching mentees:", error);
    }
  };

  // Function to refresh mentees data
  const refreshData = () => {
    menteesService
      .refresh(() => mentorApi.getMentees())
      .then(() => toast.success("Mentees list refreshed"))
      .catch(() => {});
  };

  // Function to view mentee details
  const viewMenteeDetails = (menteeId: string) => {
    router.push(`/mentor/mentees/${menteeId}`);
  };

  // Function to assign mentee by email
  const handleAssignMentee = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!menteeEmail.trim()) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsAssigning(true);

    try {
      await mentorApi.assignMentee(menteeEmail.trim());
      toast.success("Mentee assigned successfully");
      setMenteeEmail("");

      // Refresh data after successful assignment
      refreshData();
    } catch (error: any) {
      console.error("Error assigning mentee:", error);
      toast.error(error.response?.data?.error || "Failed to assign mentee");
    } finally {
      setIsAssigning(false);
    }
  };

  // Function to copy invitation link to clipboard
  const copyInviteLink = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Invitation link copied to clipboard");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Assigned Mentees</h1>
          <p className="text-gray-600">View and manage your assigned mentees</p>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={refreshData}
            disabled={menteesService.isLoading}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition disabled:opacity-50"
          >
            <ArrowPathIcon
              className={`w-4 h-4 ${
                menteesService.isLoading ? "animate-spin" : ""
              }`}
            />
            Refresh
          </button>

          <button
            onClick={() => setShowInviteLink(!showInviteLink)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90 transition"
          >
            <UserPlusIcon className="w-4 h-4" />
            Add Mentee
          </button>
        </div>
      </div>

      {/* Add Mentee Panel */}
      {showInviteLink && (
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Add New Mentee</h2>
            <button
              onClick={() => setShowInviteLink(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Assign by Email */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center">
                <EnvelopeIcon className="w-4 h-4 mr-2" />
                Assign by Email
              </h3>
              <form
                onSubmit={handleAssignMentee}
                className="flex items-center gap-2"
              >
                <input
                  type="email"
                  value={menteeEmail}
                  onChange={(e) => setMenteeEmail(e.target.value)}
                  placeholder="Enter mentee's email"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                  disabled={isAssigning}
                />
                <button
                  type="submit"
                  disabled={isAssigning}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition disabled:opacity-50"
                >
                  {isAssigning ? "Assigning..." : "Assign"}
                </button>
              </form>
            </div>

            {/* Invitation Link */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center">
                <LinkIcon className="w-4 h-4 mr-2" />
                Invitation Link
              </h3>
              <div className="text-sm text-gray-600 mb-2">
                Share this link with mentees to automatically assign them to you
                when they register.
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inviteLink}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                />
                <button
                  onClick={copyInviteLink}
                  className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
                  title="Copy to clipboard"
                >
                  <ClipboardIcon className="w-5 h-5" />
                </button>
              </div>
              {copied && (
                <p className="text-sm text-green-600">Copied to clipboard!</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mentees Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {menteesService.isLoading ? (
          <div className="text-center py-16">
            <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-2 text-gray-500">Loading mentees...</p>
          </div>
        ) : menteesService.error ? (
          <div className="text-center py-16">
            <ExclamationCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-700">Error loading mentees data.</p>
            <button
              className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition"
              onClick={refreshData}
            >
              Try Again
            </button>
          </div>
        ) : menteesService.data && menteesService.data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registration Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Branch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Profile Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {menteesService.data.map((mentee) => (
                  <tr
                    key={mentee.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <UserIcon className="h-5 w-5 text-blue-500" />
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">
                            {mentee.name ||
                              (mentee.profileCompleted
                                ? "N/A"
                                : "Profile Not Completed")}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-gray-600">
                        <EnvelopeIcon className="h-4 w-4 mr-2" />
                        <span>{mentee.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {mentee.registrationNo || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {mentee.branch || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          mentee.profileCompleted
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {mentee.profileCompleted ? "Completed" : "Incomplete"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => viewMenteeDetails(mentee.id)}
                        className="text-primary hover:text-primary/80 transition"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-700">No mentees assigned yet.</p>
            <p className="text-gray-500 mt-1">
              You can assign mentees from the dashboard.
            </p>
            <button
              className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition"
              onClick={() => router.push("/mentor/dashboard")}
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
