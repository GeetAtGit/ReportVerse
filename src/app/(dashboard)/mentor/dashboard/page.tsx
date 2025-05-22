"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { mentorApi } from "@/services/api";
import { useAuth } from "@/lib/auth";
import { useAPIService } from "@/hooks/useAPIService";
import {
  UserIcon,
  ClipboardDocumentListIcon,
  ArrowPathIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { showToast, trackPromise } from "@/components/ui/CustomToasts";
import IssueSummary from "../issues/components/IssueSummary";

// Interface aligned with backend response
interface RecentIssue {
  _id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  mentee: {
    _id: string;
    email: string;
  };
}

interface MentorDashboardData {
  totalMentees: number;
  pendingIssues: number;
  recentIssues: RecentIssue[];
}

export default function MentorDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [menteeEmail, setMenteeEmail] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  // For client-side only rendering to avoid hydration errors
  const [isClient, setIsClient] = useState(false);

  // State to store dashboard data directly
  const [dashboardData, setDashboardData] = useState<MentorDashboardData>({
    totalMentees: 0,
    pendingIssues: 0,
    recentIssues: [],
  });

  // Use API service with minimal caching to prevent stale data
  const dashboardService = useAPIService<MentorDashboardData>(null, {
    cacheTime: 30 * 1000, // 30 seconds cache - short enough to get fresh data frequently
    errorMessage: "Failed to load dashboard data",
    showErrorToast: true,
  });

  // Set isClient to true once component mounts on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Update local state when dashboardService data changes
  useEffect(() => {
    if (dashboardService.data) {
      setDashboardData(dashboardService.data);
    }
  }, [dashboardService.data]);

  // Function to fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      const response = await dashboardService.execute(
        () => mentorApi.getDashboard(),
        {
          transform: (response) => {
            if (!response?.data) {
              // If no data, maintain current values instead of resetting to 0
              return dashboardData;
            }
            return response.data;
          },
        }
      );

      console.log("Dashboard data fetched:", response);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    }
  };

  // Function to refresh all dashboard data
  const refreshData = useCallback(async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      // Get fresh data directly from API first
      const response = await mentorApi.getDashboard();

      if (response?.data?.data) {
        // Update local state immediately with fresh data
        setDashboardData(response.data.data);

        // Also update the service state
        await dashboardService.refresh(() => mentorApi.getDashboard());

        // Trigger issue summary refresh
        setRefreshTrigger((prev) => prev + 1);

        toast.success("Dashboard refreshed successfully");
      } else {
        toast.error("Failed to refresh dashboard data");
      }
    } catch (error) {
      console.error("Error refreshing dashboard:", error);
      toast.error("Failed to refresh dashboard data");
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, dashboardService]);

  // Function to handle mentee assignment
  const handleAssignMentee = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!menteeEmail.trim()) {
      showToast.error("Please enter a valid email address");
      return;
    }

    setIsAssigning(true);

    try {
      const result = await mentorApi.assignMentee(menteeEmail.trim());

      if (result?.data?.success) {
        toast.success("Mentee assigned successfully");
        setMenteeEmail("");

        // Update total mentees count immediately in local state
        setDashboardData((prev) => ({
          ...prev,
          totalMentees: prev.totalMentees + 1,
        }));

        // Then refresh all data to ensure everything is up-to-date
        await refreshData();
      }
    } catch (error: any) {
      console.error("Error assigning mentee:", error);
      toast.error(error?.response?.data?.error || "Failed to assign mentee");
    } finally {
      setIsAssigning(false);
    }
  };

  // Prepare dashboard data for display
  const dashboard = {
    totalMentees: dashboardData.totalMentees,
    pendingIssues: dashboardData.pendingIssues,
    recentIssues: dashboardData.recentIssues || [],
  };

  const statCards = [
    {
      title: "Total Mentees",
      value: dashboard.totalMentees,
      icon: UserIcon,
      color: "bg-blue-50 text-blue-500",
      onClick: () => router.push("/mentor/mentees"),
    },
    {
      title: "Pending Issues",
      value: dashboard.pendingIssues,
      icon: ClipboardDocumentListIcon,
      color: "bg-red-50 text-red-500",
      onClick: () => router.push("/mentor/issues"),
    },
  ];

  // If not client-side yet, render a simple initial state
  if (!isClient) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Mentor Dashboard</h1>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mentor Dashboard</h1>

      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">
              Welcome, {user?.name || "Mentor"}
            </h1>
            <p className="text-gray-600">
              Here's an overview of your mentees and activities
            </p>
          </div>

          <button
            onClick={refreshData}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition disabled:opacity-50"
          >
            <ArrowPathIcon
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {statCards.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
              onClick={stat.onClick}
            >
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">{stat.title}</p>
                  <p className="text-2xl font-bold">
                    {dashboardService.isLoading || isRefreshing ? (
                      <span className="inline-block w-8 h-8 bg-gray-200 rounded-md animate-pulse"></span>
                    ) : (
                      stat.value
                    )}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Issue Summary - pass refreshTrigger to force refresh */}
        <IssueSummary refreshTrigger={refreshTrigger} />

        {/* Add Mentee Form */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Add New Mentee</h2>

          <form
            onSubmit={handleAssignMentee}
            className="flex flex-col md:flex-row gap-4"
          >
            <div className="flex-grow">
              <label htmlFor="menteeEmail" className="sr-only">
                Mentee Email
              </label>
              <input
                id="menteeEmail"
                type="email"
                value={menteeEmail}
                onChange={(e) => setMenteeEmail(e.target.value)}
                placeholder="Enter mentee's email address"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={isAssigning}
                required
              />
            </div>
            <button
              type="submit"
              disabled={isAssigning}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition disabled:opacity-50 flex items-center gap-2"
            >
              {isAssigning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white"></div>
                  <span>Assigning...</span>
                </>
              ) : (
                <>
                  <UserPlusIcon className="w-5 h-5" />
                  <span>Assign Mentee</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Recent Issues */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Issues</h2>

          {dashboardService.isLoading || isRefreshing ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
            </div>
          ) : dashboard.recentIssues.length > 0 ? (
            <div className="space-y-4">
              {dashboard.recentIssues.map((issue) => (
                <div
                  key={issue._id}
                  className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition cursor-pointer"
                  onClick={() => router.push(`/mentor/issues/${issue._id}`)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {issue.title ||
                          issue.description.substring(0, 50) + "..."}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {issue.description.substring(0, 100)}
                        {issue.description.length > 100 ? "..." : ""}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        issue.status === "Open"
                          ? "bg-red-100 text-red-800"
                          : issue.status === "Under Review"
                          ? "bg-amber-100 text-amber-800"
                          : issue.status === "Resolved"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {issue.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-xs text-gray-500">
                      {new Date(issue.createdAt).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-primary">
                      {issue.mentee?.email || "Unknown mentee"}
                    </span>
                  </div>
                </div>
              ))}
              <div className="text-center mt-4">
                <button
                  onClick={() => router.push("/mentor/issues")}
                  className="text-primary text-sm hover:underline"
                >
                  View all issues
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ClipboardDocumentListIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p>No pending issues</p>
              <button
                onClick={() => router.push("/mentor/issues/new")}
                className="text-primary text-sm mt-2 hover:underline"
              >
                Create a new issue
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
