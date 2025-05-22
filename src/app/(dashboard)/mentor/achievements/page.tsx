"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { mentorApi } from "@/services/api";
import { useAPIService } from "@/hooks/useAPIService";
import {
  TrophyIcon,
  ArrowPathIcon,
  FunnelIcon,
  UserIcon,
  CalendarIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { showToast, trackPromise } from "@/components/ui/CustomToasts";

interface Achievement {
  _id: string;
  type: string;
  position: string;
  description: string;
  dateOfAchievement: string;
  mentee: {
    _id: string;
    email: string;
    name?: string;
  };
}

// Define achievement types from backend
const achievementTypes = [
  "Sports",
  "Competitive Exam",
  "Internship",
  "Research Publication",
  "Award",
  "Cultural Event",
  "Technical Event",
  "Hackathon",
  "Other",
];

// Define positions from backend
const achievementPositions = [
  "All Positions",
  "1st",
  "2nd",
  "3rd",
  "Participation",
  "Winner",
  "Runner-up",
  "Completed",
  "Published",
  "N/A",
];

export default function MentorAchievementsPage() {
  const router = useRouter();
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [positionFilter, setPositionFilter] = useState<string>("All Positions");
  const [showFilters, setShowFilters] = useState(false);
  const [debugAchievements, setDebugAchievements] = useState<Achievement[]>([]);

  // Use our enhanced API service hook with caching
  const achievementsService = useAPIService<Achievement[]>([], {
    cacheTime: 5 * 60 * 1000, // Cache for 5 minutes
    errorMessage: "Failed to load achievements data",
    showErrorToast: true,
  });

  useEffect(() => {
    fetchAchievements();
  }, [typeFilter, positionFilter]);

  // Function to fetch achievements data with filters
  const fetchAchievements = async () => {
    try {
      await achievementsService.execute(async () => {
        // Build query parameters for filtering
        const params: Record<string, string> = {};

        if (typeFilter !== "All") {
          params.type = typeFilter;
        }

        if (positionFilter !== "All Positions") {
          params.position = positionFilter;
        }

        // Pass the params as options to the API call
        const response = await mentorApi.getAchievements({ params });
        console.log("Achievements API response:", response);
        const achievementsData = response.data.data || [];
        console.log("Achievements data:", achievementsData);

        // Store a copy for debugging
        setDebugAchievements(achievementsData);

        return achievementsData;
      });
    } catch (error) {
      console.error("Error fetching achievements:", error);
    }
  };

  // Function to refresh achievements data
  const refreshData = () => {
    trackPromise(
      achievementsService.refresh(async () => {
        // Include the current filters when refreshing
        const params: Record<string, string> = {};

        if (typeFilter !== "All") {
          params.type = typeFilter;
        }

        if (positionFilter !== "All Positions") {
          params.position = positionFilter;
        }

        const response = await mentorApi.getAchievements({ params });
        console.log("Refreshed achievements API response:", response);
        const achievementsData = response.data.data || [];
        console.log("Refreshed achievements data:", achievementsData);

        // Store a copy for debugging
        setDebugAchievements(achievementsData);

        return achievementsData;
      }),
      {
        loading: "Refreshing achievements...",
        success: "Achievements list refreshed",
        error: "Failed to refresh achievements",
      }
    ).catch(() => {
      // Error already handled by trackPromise
    });
  };

  // Log the current state for debugging
  useEffect(() => {
    console.log("Debug achievements state:", debugAchievements);
    console.log("Achievements service data:", achievementsService.data);
    console.log("Achievements service loading:", achievementsService.isLoading);
  }, [
    debugAchievements,
    achievementsService.data,
    achievementsService.isLoading,
  ]);

  // Function to reset all filters
  const resetFilters = () => {
    setTypeFilter("All");
    setPositionFilter("All Positions");
  };

  // Format date to readable format
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";

    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Directly use debugAchievements as fallback if achievementsService.data is empty
  const displayAchievements =
    achievementsService.data && achievementsService.data.length > 0
      ? achievementsService.data
      : debugAchievements.filter((achievement) => {
          if (typeFilter !== "All" && achievement.type !== typeFilter)
            return false;
          if (
            positionFilter !== "All Positions" &&
            achievement.position !== positionFilter
          )
            return false;
          return true;
        });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Mentee Achievements</h1>
          <p className="text-gray-600">
            View achievements reported by your mentees
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition"
          >
            <FunnelIcon className="w-4 h-4" />
            Filters
          </button>

          <button
            onClick={refreshData}
            disabled={achievementsService.isLoading}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition disabled:opacity-50"
          >
            <ArrowPathIcon
              className={`w-4 h-4 ${
                achievementsService.isLoading ? "animate-spin" : ""
              }`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm p-5 animate-slideDown">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium">Filter Achievements</h2>
            <button
              onClick={resetFilters}
              className="text-sm text-primary hover:underline"
            >
              Reset All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Achievement Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
              >
                <option value="All">All Types</option>
                {achievementTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Position Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Position/Status
              </label>
              <select
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
                className="w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
              >
                {achievementPositions.map((position) => (
                  <option key={position} value={position}>
                    {position}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button
              onClick={() => setShowFilters(false)}
              className="flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <XMarkIcon className="w-4 h-4 mr-1" />
              Close Filters
            </button>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {(typeFilter !== "All" || positionFilter !== "All Positions") && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-500">Active filters:</span>

          {typeFilter !== "All" && (
            <div className="flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
              Type: {typeFilter}
              <button
                onClick={() => setTypeFilter("All")}
                className="ml-1.5 rounded-full hover:bg-blue-100 p-0.5"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </div>
          )}

          {positionFilter !== "All Positions" && (
            <div className="flex items-center bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm">
              Position: {positionFilter}
              <button
                onClick={() => setPositionFilter("All Positions")}
                className="ml-1.5 rounded-full hover:bg-purple-100 p-0.5"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Achievements Display */}
      {achievementsService.isLoading ? (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center py-16">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-2 text-gray-500">Loading achievements...</p>
        </div>
      ) : displayAchievements && displayAchievements.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Type
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Position
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
                    Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Mentee
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayAchievements.map((achievement) => (
                  <tr key={achievement._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="bg-amber-100 p-1.5 rounded-full mr-2">
                          <TrophyIcon className="w-4 h-4 text-amber-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {achievement.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        {achievement.position}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-500 line-clamp-2 max-w-md">
                        {achievement.description}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <CalendarIcon className="w-4 h-4 mr-1.5 text-gray-400" />
                        {formatDate(achievement.dateOfAchievement)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <UserIcon className="w-4 h-4 mr-1.5 text-gray-400" />
                        <button
                          onClick={() =>
                            router.push(
                              `/mentor/mentees/${achievement.mentee._id}`
                            )
                          }
                          className="text-sm text-primary hover:underline"
                        >
                          {achievement.mentee?.email || "Unknown mentee"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center py-16">
          <TrophyIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No achievements found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {typeFilter !== "All" || positionFilter !== "All Positions"
              ? "No achievements match your current filters."
              : "No achievements have been reported by your mentees yet."}
          </p>
          {(typeFilter !== "All" || positionFilter !== "All Positions") && (
            <button
              onClick={resetFilters}
              className="mt-4 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Add animation for filter display
import "./achievements.css";
