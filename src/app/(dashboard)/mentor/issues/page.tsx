"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { mentorApi } from "@/services/api";
import { useAPIService } from "@/hooks/useAPIService";
import {
  ClipboardDocumentListIcon,
  ArrowPathIcon,
  FunnelIcon,
  UserIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { showToast, trackPromise } from "@/components/ui/CustomToasts";

interface Issue {
  _id: string;
  mentee: {
    _id: string;
    email: string;
  };
  mentor: string;
  issueType: string;
  description: string;
  status: string;
  comments: {
    user: {
      _id: string;
      email: string;
      role: string;
    };
    text: string;
    createdAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

type StatusFilter = "All" | "Open" | "Under Review" | "Resolved" | "Closed";

export default function MentorIssuesPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [debugIssues, setDebugIssues] = useState<any[]>([]);

  // Use our enhanced API service hook with caching
  const issuesService = useAPIService<Issue[]>([], {
    cacheTime: 5 * 60 * 1000, // Cache for 5 minutes
    errorMessage: "Failed to load issues data",
    showErrorToast: true,
  });

  useEffect(() => {
    fetchIssues();
  }, []);

  // Function to fetch issues data
  const fetchIssues = async () => {
    try {
      await issuesService.execute(async () => {
        const response = await mentorApi.getIssues();
        console.log("Raw API response:", response);
        const issuesData = response.data.data || [];
        console.log("Issues data:", issuesData);

        // Store a copy for debugging
        setDebugIssues(issuesData);

        return issuesData;
      });
    } catch (error) {
      console.error("Error fetching issues:", error);
    }
  };

  // Function to refresh issues data
  const refreshData = () => {
    trackPromise(
      issuesService.refresh(async () => {
        const response = await mentorApi.getIssues();
        console.log("Refreshed API response:", response);
        const issuesData = response.data.data || [];
        console.log("Refreshed issues data:", issuesData);

        // Store a copy for debugging
        setDebugIssues(issuesData);

        return issuesData;
      }),
      {
        loading: "Refreshing issues...",
        success: "Issues list refreshed",
        error: "Failed to refresh issues",
      }
    ).catch(() => {
      // Error already handled by trackPromise
    });
  };

  // Function to filter issues by status
  const filteredIssues = issuesService.data?.filter((issue) => {
    if (statusFilter === "All") return true;
    return issue.status === statusFilter;
  });

  // Log the filtered issues for debugging
  useEffect(() => {
    console.log("Filtered issues:", filteredIssues);
    console.log("Debug issues state:", debugIssues);
    console.log("Issues service data:", issuesService.data);
    console.log("Issues service loading:", issuesService.isLoading);
  }, [
    filteredIssues,
    debugIssues,
    issuesService.data,
    issuesService.isLoading,
  ]);

  // Status filter options
  const statusOptions: StatusFilter[] = [
    "All",
    "Open",
    "Under Review",
    "Resolved",
    "Closed",
  ];

  // Get status badge color based on status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-red-100 text-red-800";
      case "Under Review":
        return "bg-amber-100 text-amber-800";
      case "Resolved":
        return "bg-green-100 text-green-800";
      case "Closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  // Directly use debugIssues as fallback if issuesService.data is empty
  const displayIssues =
    filteredIssues && filteredIssues.length > 0
      ? filteredIssues
      : statusFilter === "All"
      ? debugIssues.filter((issue) => issue && issue._id)
      : debugIssues.filter((issue) => issue && issue.status === statusFilter);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Mentee Issues</h1>
          <p className="text-gray-600">
            View and manage issues reported by your mentees
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/mentor/issues/new")}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition"
          >
            <PlusIcon className="h-5 w-5" />
            Create Issue
          </button>
          <button
            onClick={refreshData}
            disabled={issuesService.isLoading}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition disabled:opacity-50"
          >
            <ArrowPathIcon
              className={`w-4 h-4 ${
                issuesService.isLoading ? "animate-spin" : ""
              }`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Debug info */}
      {false && (
        <div className="bg-gray-100 p-3 rounded-md text-xs overflow-x-auto">
          <p>Issues count: {displayIssues?.length || 0}</p>
          <p>Loading state: {issuesService.isLoading ? "Loading" : "Done"}</p>
          <p>Filter: {statusFilter}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center space-x-2">
          <FunnelIcon className="w-5 h-5 text-gray-500" />
          <span className="text-sm font-medium">Filter by status:</span>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 text-xs font-medium rounded-full ${
                  statusFilter === status
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Issues Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {issuesService.isLoading ? (
          <div className="text-center py-16">
            <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-2 text-gray-500">Loading issues...</p>
          </div>
        ) : displayIssues && displayIssues.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mentee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayIssues.map((issue) => (
                  <tr
                    key={issue._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                          <ClipboardDocumentListIcon className="h-5 w-5 text-red-500" />
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900 truncate max-w-xs">
                            {issue.issueType}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {issue.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <UserIcon className="h-4 w-4 text-blue-500" />
                        </div>
                        <div className="ml-3 text-sm text-gray-500">
                          {issue.mentee?.email || "Unknown mentee"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {issue.issueType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          issue.status
                        )}`}
                      >
                        {issue.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(issue.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() =>
                          router.push(`/mentor/issues/${issue._id}`)
                        }
                        className="text-primary hover:text-primary/80"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="flex flex-col items-center">
              <ClipboardDocumentListIcon className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-500 mb-1">
                No issues found
              </h3>
              <p className="text-gray-400 mb-4">
                {statusFilter !== "All"
                  ? `No ${statusFilter.toLowerCase()} issues available.`
                  : "No issues have been reported by your mentees yet."}
              </p>
              <button
                onClick={() => router.push("/mentor/issues/new")}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition"
              >
                Create New Issue
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
