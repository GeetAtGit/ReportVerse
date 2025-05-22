"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { menteeApi } from "@/services/api";
import { useAuth } from "@/lib/auth";
import { useAPIService } from "@/hooks/useAPIService";
import {
  ClipboardDocumentListIcon,
  TrophyIcon,
  UserIcon,
  ArrowPathIcon,
  InboxStackIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { showToast, trackPromise } from "@/components/ui/CustomToasts";
import Link from "next/link";

// Interface representing the exact backend response structure
interface DashboardData {
  profileCompletion: number;
  pendingIssues: number;
  completedAchievements: number;
  backlogs: number;
  upcomingEvents: any[];
  recentAchievements: Achievement[];
  mentorInfo?: {
    name: string;
    email: string;
    phone?: string;
  };
}

interface Achievement {
  _id: string;
  title: string;
  description: string;
  dateOfAchievement: string;
  category: string;
  isCompleted: boolean;
  mentee: string;
  mentor: string;
  createdAt: string;
  updatedAt: string;
}

export default function MenteeDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Use our enhanced API service hook with caching
  const dashboardService = useAPIService<DashboardData>(null, {
    cacheTime: 5 * 60 * 1000, // Cache for 5 minutes
    errorMessage: "Failed to load dashboard data",
    showErrorToast: true,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Function to fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      await dashboardService.execute(() => menteeApi.getDashboard(), {
        transform: (response) => {
          // Extract the data from the response
          if (response && response.success && response.data) {
            console.log("Dashboard data received:", response.data);
            return response.data;
          } else {
            console.error("Invalid dashboard data format:", response);
            throw new Error("Invalid dashboard data format");
          }
        },
        onError: (error) => {
          console.error("Dashboard fetch error:", error);
        },
      });
    } catch (error) {
      console.error("Dashboard error:", error);
    }
  };

  // Function to refresh dashboard data
  const refreshData = async () => {
    if (dashboardService.isLoading) return;

    try {
      await trackPromise(
        dashboardService.refresh(() => menteeApi.getDashboard()),
        {
          loading: "Refreshing dashboard...",
          success: "Dashboard refreshed successfully",
          error: "Failed to refresh dashboard data",
        }
      );
    } catch (error) {
      console.error("Error refreshing dashboard:", error);
      // Error already handled by trackPromise
    }
  };

  // Handle the case when data hasn't loaded yet
  const dashboard = dashboardService.data || {
    profileCompletion: 0,
    completedAchievements: 0,
    pendingIssues: 0,
    backlogs: 0,
    upcomingEvents: [],
    recentAchievements: [],
    mentorInfo: {
      name: "Not Assigned",
      email: "N/A",
      phone: "N/A",
    },
  };

  // Define stat cards based on actual backend response
  const statCards = [
    {
      title: "Mentor Name",
      value: dashboard.mentorInfo?.name || "Not Assigned",
      icon: UserIcon,
      color: "bg-blue-50 text-blue-500",
      onClick: () => {},
    },
    {
      title: "Active Backlogs",
      value: dashboard.backlogs,
      icon: InboxStackIcon,
      color: "bg-green-50 text-green-500",
      onClick: () => router.push("/mentee/academics"),
    },
    {
      title: "Achievements",
      value: dashboard.completedAchievements,
      icon: TrophyIcon,
      color: "bg-amber-50 text-amber-500",
      onClick: () => router.push("/mentee/achievements"),
    },
    {
      title: "Pending Issues",
      value: dashboard.pendingIssues,
      icon: ClipboardDocumentListIcon,
      color: "bg-red-50 text-red-500",
      onClick: () => router.push("/mentee/issues"),
    },
  ];

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-8">
      {/* Header with welcome message and refresh button */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome, {user?.name || "Student"}
          </h1>
          <p className="text-gray-600">Here's an overview of your dashboard</p>
        </div>

        <button
          onClick={refreshData}
          disabled={dashboardService.isLoading}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition disabled:opacity-50"
        >
          <ArrowPathIcon
            className={`w-4 h-4 ${
              dashboardService.isLoading ? "animate-spin" : ""
            }`}
          />
          Refresh
        </button>
      </div>

      {/* Error state */}
      {dashboardService.error && !dashboardService.isLoading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
            <p>
              There was an error loading your dashboard. Please try refreshing.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                  {dashboardService.isLoading ? "..." : stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Profile Completion */}
      {dashboard.profileCompletion < 100 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Profile Completion</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                Complete your profile to get the most out of ReportVerse
              </span>
              <span className="font-medium">
                {dashboard.profileCompletion}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-primary h-2.5 rounded-full"
                style={{ width: `${dashboard.profileCompletion}%` }}
              ></div>
            </div>
            <div className="pt-2">
              <Link
                href="/mentee/profile"
                className="text-primary hover:text-primary/80 text-sm font-medium"
              >
                Complete Your Profile
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Mentor Information */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Your Mentor</h2>

        {dashboardService.isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-2 text-gray-500">Loading mentor information...</p>
          </div>
        ) : !dashboard.mentorInfo ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No mentor assigned yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Name</p>
                <p className="font-medium">{dashboard.mentorInfo.name}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Email</p>
                <p className="font-medium">{dashboard.mentorInfo.email}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Phone</p>
                <p className="font-medium">
                  {dashboard.mentorInfo.phone || "Not provided"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Achievements & Issues */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Achievements */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Recent Achievements</h2>
            <button
              className="text-primary hover:text-primary/80 text-sm font-medium"
              onClick={() => router.push("/mentee/achievements")}
            >
              View All
            </button>
          </div>

          {dashboardService.isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-2 text-gray-500">Loading achievements...</p>
            </div>
          ) : dashboard.recentAchievements &&
            dashboard.recentAchievements.length > 0 ? (
            <div className="space-y-3">
              {dashboard.recentAchievements.slice(0, 3).map((achievement) => (
                <div
                  key={achievement._id}
                  className="flex items-start space-x-3 p-3 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
                >
                  <div className="flex-shrink-0">
                    <TrophyIcon className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-medium">{achievement.title}</p>
                    <p className="text-sm text-gray-500">
                      {formatDate(achievement.dateOfAchievement)}
                    </p>
                    {achievement.category && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-amber-200 text-amber-800 text-xs rounded-full">
                        {achievement.category}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No achievements yet</p>
              <button
                className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition"
                onClick={() => router.push("/mentee/achievements/new")}
              >
                Add Achievement
              </button>
            </div>
          )}
        </div>

        {/* Issues */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Pending Issues</h2>
            <button
              className="text-primary hover:text-primary/80 text-sm font-medium"
              onClick={() => router.push("/mentee/issues")}
            >
              View All
            </button>
          </div>

          {dashboardService.isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-2 text-gray-500">Loading issues...</p>
            </div>
          ) : dashboard.pendingIssues > 0 ? (
            <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
              <div className="flex items-center">
                <ClipboardDocumentListIcon className="w-6 h-6 text-red-500 mr-3" />
                <div>
                  <p className="font-medium">
                    You have {dashboard.pendingIssues} pending issues
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Check your issues page to see details
                  </p>
                </div>
              </div>
              <button
                className="w-full mt-4 px-4 py-2 bg-white border border-red-200 text-red-600 font-medium rounded-md hover:bg-red-50 transition"
                onClick={() => router.push("/mentee/issues")}
              >
                View Issues
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No pending issues</p>
              <button
                className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition"
                onClick={() => router.push("/mentee/issues/new")}
              >
                Report an Issue
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
