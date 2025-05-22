"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useAPIService } from "@/hooks/useAPIService";
import { menteeApi } from "@/services/api";
import {
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  PlusIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

// Interface aligned with the backend Issue model
interface Issue {
  _id: string;
  issueType: string; // enum: ['Academic', 'Grievances', 'Ragging', 'Harassment', 'Accommodation', 'Other']
  description: string;
  status: string; // enum: ['Open', 'Under Review', 'Resolved', 'Closed']
  comments: Array<any>;
  createdAt: string;
  updatedAt: string;
}

export default function IssuesPage() {
  const router = useRouter();
  const issuesService = useAPIService<Issue[]>([]);

  useEffect(() => {
    loadIssues();
  }, []);

  async function loadIssues() {
    try {
      await issuesService.execute(() => menteeApi.getIssues(), {
        transform: (response) => {
          // Extract the data from the response
          return response.data || [];
        },
      });
    } catch (error) {
      console.error("Failed to load issues:", error);
      toast.error("Failed to load issues");
    }
  }

  // Get status badge based on issue status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Open":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 flex items-center">
            <ExclamationCircleIcon className="w-3 h-3 mr-1" />
            Open
          </span>
        );
      case "Under Review":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 flex items-center">
            <ClockIcon className="w-3 h-3 mr-1" />
            Under Review
          </span>
        );
      case "Resolved":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 flex items-center">
            <CheckCircleIcon className="w-3 h-3 mr-1" />
            Resolved
          </span>
        );
      case "Closed":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 flex items-center">
            <XCircleIcon className="w-3 h-3 mr-1" />
            Closed
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  // Format date to readable format
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Issues</h1>
        <button
          onClick={() => router.push("/mentee/issues/new")}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition"
        >
          <PlusIcon className="h-5 w-5" />
          Report New Issue
        </button>
      </div>

      {issuesService.isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : issuesService.data && issuesService.data.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Issue Type
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Description
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Date Reported
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">View</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {issuesService.data.map((issue) => (
                <tr
                  key={issue._id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/mentee/issues/${issue._id}`)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {issue.issueType}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 truncate max-w-xs">
                      {issue.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(issue.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(issue.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/mentee/issues/${issue._id}`);
                      }}
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
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="flex flex-col items-center justify-center space-y-4">
            <ExclamationCircleIcon className="h-16 w-16 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900">
              No issues reported yet
            </h3>
            <p className="text-gray-500">
              When you encounter a problem or have a question, report it here to
              get help from your mentor.
            </p>
            <button
              onClick={() => router.push("/mentee/issues/new")}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition"
            >
              Report Your First Issue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
