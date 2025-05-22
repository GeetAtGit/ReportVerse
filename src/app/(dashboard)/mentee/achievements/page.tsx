"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useAPIService } from "@/hooks/useAPIService";
import { menteeApi } from "@/services/api";
import {
  TrophyIcon,
  CalendarIcon,
  PlusIcon,
  TagIcon,
} from "@heroicons/react/24/outline";

// Interface aligned with the backend Achievement model
interface Achievement {
  _id: string;
  type: string; // enum: ['Sports', 'Competitive Exam', 'Internship', 'Research Publication', 'Award', 'Cultural Event', 'Technical Event', 'Hackathon', 'Other']
  position: string; // enum: ['1st', '2nd', '3rd', 'Participation', 'Winner', 'Runner-up', 'Completed', 'Published', 'N/A']
  description: string;
  dateOfAchievement: string;
}

export default function AchievementsPage() {
  const router = useRouter();
  const achievementsService = useAPIService<Achievement[]>([]);

  useEffect(() => {
    loadAchievements();
  }, []);

  async function loadAchievements() {
    try {
      await achievementsService.execute(() => menteeApi.getAchievements(), {
        transform: (response) => {
          // Extract the data from the response
          return response.data || [];
        },
      });
    } catch (error) {
      console.error("Failed to load achievements:", error);
      toast.error("Failed to load achievements");
    }
  }

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
        <h1 className="text-2xl font-bold">Achievements</h1>
        <button
          onClick={() => router.push("/mentee/achievements/new")}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition"
        >
          <PlusIcon className="h-5 w-5" />
          Add Achievement
        </button>
      </div>

      {achievementsService.isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : achievementsService.data && achievementsService.data.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievementsService.data.map((achievement) => (
            <div
              key={achievement._id}
              className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <TrophyIcon className="h-6 w-6 text-amber-500 mr-2" />
                    <h2 className="text-lg font-semibold text-gray-900 truncate">
                      {achievement.type}
                    </h2>
                  </div>
                  {achievement.position !== "N/A" && (
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      {achievement.position}
                    </span>
                  )}
                </div>

                <p className="text-gray-600 mb-4 line-clamp-3">
                  {achievement.description}
                </p>

                <div className="flex items-center text-gray-500 text-sm">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  {formatDate(achievement.dateOfAchievement)}
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-3">
                <button
                  onClick={() => {
                    // View achievement details - in a real app, you'd navigate to a detail page
                    toast.success(
                      "Feature coming soon: View achievement details"
                    );
                  }}
                  className="text-primary hover:text-primary/80 text-sm font-medium"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="flex flex-col items-center justify-center space-y-4">
            <TrophyIcon className="h-16 w-16 text-amber-400" />
            <h3 className="text-lg font-medium text-gray-900">
              No achievements yet
            </h3>
            <p className="text-gray-500">
              Start adding your academic and extracurricular achievements to
              showcase your progress.
            </p>
            <button
              onClick={() => router.push("/mentee/achievements/new")}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition"
            >
              Add Your First Achievement
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
