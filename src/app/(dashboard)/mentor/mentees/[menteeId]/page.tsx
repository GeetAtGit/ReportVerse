"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { mentorApi } from "@/services/api";
import {
  UserIcon,
  AcademicCapIcon,
  TrophyIcon,
  ClipboardDocumentListIcon,
  PhoneIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  ArrowLeftIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

// Interfaces aligned with backend models
interface MenteeProfile {
  user: string;
  name?: string;
  registrationNo?: string;
  section?: string;
  rollNo?: string;
  branch?: string;
  mobileNo?: string;
  hostelBlockNo?: string;
  roomNo?: string;
  bloodGroup?: string;
  dob?: Date;
  alumniFamily?: {
    status: boolean;
    details: string;
  };
  fatherDetails?: {
    name: string;
    occupation: string;
    organizationDesignation: string;
    mobileNo: string;
    emailId: string;
  };
  motherDetails?: {
    name: string;
    occupation: string;
    organizationDesignation: string;
    mobileNo: string;
    emailId: string;
  };
  communicationAddress?: {
    address: string;
    pinCode: string;
  };
  permanentAddress?: {
    address: string;
    pinCode: string;
  };
  createdAt?: string;
  updatedAt?: string;
  email?: string;
  profileCompleted?: boolean;
}

interface AcademicRecord {
  mentee: string;
  semesterGPA: {
    semester: number;
    gpa: number;
  }[];
  moocCourses: string[];
  certifications: string[];
  semesterMarksheets: {
    semester: number;
    imageUrl: string;
    _id?: string;
  }[];
  backlogs: number;
  createdAt: string;
  updatedAt: string;
}

interface Achievement {
  _id: string;
  mentee: string;
  mentor: string;
  type: string;
  position: string;
  description: string;
  dateOfAchievement: string;
  certificateUrl?: string;
  createdAt: string;
  updatedAt: string;
}

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

type TabType = "profile" | "academics" | "achievements" | "issues";

export default function MenteeDetailsPage({
  params,
}: {
  params: { menteeId: string };
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menteeProfile, setMenteeProfile] = useState<MenteeProfile | null>(
    null
  );
  const [menteeAcademics, setMenteeAcademics] = useState<AcademicRecord | null>(
    null
  );
  const [menteeAchievements, setMenteeAchievements] = useState<Achievement[]>(
    []
  );
  const [allMentorIssues, setAllMentorIssues] = useState<Issue[]>([]);

  // Filter issues for this mentee only
  const menteeIssues = useMemo(() => {
    return allMentorIssues.filter(
      (issue) => issue.mentee && issue.mentee._id === params.menteeId
    );
  }, [allMentorIssues, params.menteeId]);

  useEffect(() => {
    if (params.menteeId) {
      fetchMenteeData();
    }
  }, [params.menteeId]);

  const fetchMenteeData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel
      const [profileRes, academicsRes, achievementsRes, issuesRes] =
        await Promise.all([
          mentorApi.getMenteeProfile(params.menteeId).catch((error) => {
            console.error("Error fetching profile:", error);
            // Return a default response that our UI can handle
            return {
              data: {
                success: true,
                profileCompleted: false,
                data: {
                  user: params.menteeId,
                  profileCompleted: false,
                  email: "Not available",
                },
                message: "Mentee has not completed their profile yet",
              },
            };
          }),
          mentorApi.getMenteeAcademics(params.menteeId).catch((error) => {
            console.error("Error fetching academics:", error);
            // Return a default response that our UI can handle
            return {
              data: {
                success: true,
                data: {
                  mentee: params.menteeId,
                  semesterGPA: [],
                  moocCourses: [],
                  certifications: [],
                  semesterMarksheets: [],
                  backlogs: 0,
                },
                message: "Mentee has not added any academic records yet",
              },
            };
          }),
          mentorApi.getMenteeAchievements(params.menteeId).catch((error) => {
            console.error("Error fetching achievements:", error);
            return { data: { success: true, data: [] } };
          }),
          mentorApi.getIssues().catch((error) => {
            console.error("Error fetching issues:", error);
            return { data: { success: false, data: [] } };
          }),
        ]);

      // Process profile data
      if (profileRes.data.success) {
        setMenteeProfile(profileRes.data.data);
      } else {
        console.error("Failed to load profile data:", profileRes.data);
      }

      // Process academics data
      if (academicsRes.data.success) {
        setMenteeAcademics(academicsRes.data.data);
      } else {
        console.error("Failed to load academic data:", academicsRes.data);
      }

      // Process achievements data
      if (achievementsRes.data.success) {
        setMenteeAchievements(achievementsRes.data.data || []);
      } else {
        console.error(
          "Failed to load achievements data:",
          achievementsRes.data
        );
      }

      // Process issues data
      if (issuesRes.data.success) {
        setAllMentorIssues(issuesRes.data.data || []);
      } else {
        console.error("Failed to load issues data:", issuesRes.data);
      }
    } catch (error: any) {
      console.error("Error fetching mentee data:", error);
      setError("Failed to load mentee data. Please try again.");
      toast.error("Failed to load mentee data");
    } finally {
      setLoading(false);
    }
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="text-center py-20">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-2 text-gray-500">Loading data...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-20">
          <ExclamationCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-700 font-medium">Error loading data</p>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={fetchMenteeData}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition"
          >
            Try Again
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case "profile":
        return renderProfileTab();
      case "academics":
        return renderAcademicsTab();
      case "achievements":
        return renderAchievementsTab();
      case "issues":
        return renderIssuesTab();
      default:
        return null;
    }
  };

  const renderProfileTab = () => {
    if (!menteeProfile) {
      return (
        <div className="text-center py-16">
          <p className="text-gray-500">Profile data not available</p>
        </div>
      );
    }

    // Handle case where profile is not completed
    if (menteeProfile.profileCompleted === false) {
      return (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center py-8">
            <UserIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Profile Not Completed
            </h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              This mentee hasn't completed their profile yet. Only basic
              information is available.
            </p>

            <div className="max-w-md mx-auto bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center mb-4">
                <EnvelopeIcon className="h-5 w-5 text-blue-500 mr-3" />
                <span className="text-blue-900 font-medium">Email:</span>
                <span className="ml-2 text-blue-800">
                  {menteeProfile.email || "N/A"}
                </span>
              </div>

              <div className="text-sm text-blue-700">
                <p>
                  You'll be able to see more details once the mentee completes
                  their profile.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Full Name</p>
              <p className="font-medium">{menteeProfile.name || "N/A"}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Registration Number</p>
              <p className="font-medium">
                {menteeProfile.registrationNo || "N/A"}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Mobile Number</p>
              <p className="font-medium flex items-center">
                <PhoneIcon className="w-4 h-4 mr-2 text-gray-400" />
                {menteeProfile.mobileNo || "N/A"}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Blood Group</p>
              <p className="font-medium">{menteeProfile.bloodGroup || "N/A"}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Date of Birth</p>
              <p className="font-medium">
                {menteeProfile.dob
                  ? new Date(menteeProfile.dob).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Roll Number</p>
              <p className="font-medium">{menteeProfile.rollNo || "N/A"}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Academic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Branch</p>
              <p className="font-medium">{menteeProfile.branch || "N/A"}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Section</p>
              <p className="font-medium">{menteeProfile.section || "N/A"}</p>
            </div>
          </div>
        </div>

        {menteeProfile.hostelBlockNo || menteeProfile.roomNo ? (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Hostel Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">
                  Hostel Block Number
                </p>
                <p className="font-medium">
                  {menteeProfile.hostelBlockNo || "N/A"}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Room Number</p>
                <p className="font-medium">{menteeProfile.roomNo || "N/A"}</p>
              </div>
            </div>
          </div>
        ) : null}

        {menteeProfile.fatherDetails || menteeProfile.motherDetails ? (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Parent Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {menteeProfile.fatherDetails &&
                menteeProfile.fatherDetails.name && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Father Details</p>
                    <p className="font-medium">
                      Name: {menteeProfile.fatherDetails.name || "N/A"}
                    </p>
                    <p className="text-sm text-gray-600">
                      Occupation:{" "}
                      {menteeProfile.fatherDetails.occupation || "N/A"}
                    </p>
                    <p className="text-sm text-gray-600">
                      Mobile: {menteeProfile.fatherDetails.mobileNo || "N/A"}
                    </p>
                  </div>
                )}
              {menteeProfile.motherDetails &&
                menteeProfile.motherDetails.name && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Mother Details</p>
                    <p className="font-medium">
                      Name: {menteeProfile.motherDetails.name || "N/A"}
                    </p>
                    <p className="text-sm text-gray-600">
                      Occupation:{" "}
                      {menteeProfile.motherDetails.occupation || "N/A"}
                    </p>
                    <p className="text-sm text-gray-600">
                      Mobile: {menteeProfile.motherDetails.mobileNo || "N/A"}
                    </p>
                  </div>
                )}
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  const renderAcademicsTab = () => {
    if (!menteeAcademics) {
      return (
        <div className="text-center py-16">
          <p className="text-gray-500">Academic data not available</p>
        </div>
      );
    }

    // Check if academic record has any meaningful data
    const hasNoData =
      (!menteeAcademics.semesterGPA ||
        menteeAcademics.semesterGPA.length === 0) &&
      (!menteeAcademics.moocCourses ||
        menteeAcademics.moocCourses.length === 0) &&
      (!menteeAcademics.certifications ||
        menteeAcademics.certifications.length === 0) &&
      (!menteeAcademics.semesterMarksheets ||
        menteeAcademics.semesterMarksheets.length === 0) &&
      (!menteeAcademics.backlogs || menteeAcademics.backlogs === 0);

    if (hasNoData) {
      return (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center py-8">
            <AcademicCapIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Academic Data Yet
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              This mentee hasn't added any academic records yet. Check back
              later for updates on their academic progress.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Academic Progress</h3>
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Active Backlogs</p>
              <p className="font-medium text-2xl">
                {menteeAcademics.backlogs || 0}
              </p>
            </div>
          </div>
        </div>

        {menteeAcademics.semesterGPA &&
          menteeAcademics.semesterGPA.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Semester GPA</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {menteeAcademics.semesterGPA
                  .sort((a, b) => a.semester - b.semester)
                  .map((semGPA, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      <div className="bg-blue-50 p-3 text-center">
                        <h4 className="font-medium text-blue-800">
                          Semester {semGPA.semester}
                        </h4>
                      </div>
                      <div className="p-4 text-center">
                        <p className="text-2xl font-bold">
                          {semGPA.gpa.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

        {menteeAcademics.semesterMarksheets &&
        menteeAcademics.semesterMarksheets.length > 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Semester Marksheets</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {menteeAcademics.semesterMarksheets
                .sort((a, b) => a.semester - b.semester)
                .map((marksheet) => (
                  <div
                    key={marksheet._id || `sem-${marksheet.semester}`}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <div className="bg-blue-50 p-3 text-center">
                      <h4 className="font-medium text-blue-800">
                        Semester {marksheet.semester}
                      </h4>
                    </div>
                    {marksheet.imageUrl ? (
                      <a
                        href={marksheet.imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-4 text-center text-primary hover:underline"
                      >
                        View Marksheet
                      </a>
                    ) : (
                      <p className="p-4 text-center text-gray-500">
                        No marksheet uploaded
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        ) : null}

        {/* MOOC Courses */}
        {menteeAcademics.moocCourses &&
          menteeAcademics.moocCourses.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">MOOC Courses</h3>
              <ul className="list-disc pl-5 space-y-1">
                {menteeAcademics.moocCourses.map((course, index) => (
                  <li key={index} className="text-gray-700">
                    {course}
                  </li>
                ))}
              </ul>
            </div>
          )}

        {/* Certifications */}
        {menteeAcademics.certifications &&
          menteeAcademics.certifications.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Certifications</h3>
              <ul className="list-disc pl-5 space-y-1">
                {menteeAcademics.certifications.map((cert, index) => (
                  <li key={index} className="text-gray-700">
                    {cert}
                  </li>
                ))}
              </ul>
            </div>
          )}
      </div>
    );
  };

  const renderAchievementsTab = () => {
    if (menteeAchievements.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center py-8">
            <TrophyIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Achievements Yet
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              This mentee hasn't recorded any achievements yet. Achievements
              will appear here once the mentee adds them.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <h3 className="text-lg font-semibold p-6 border-b">
            Achievements List
          </h3>
          <div className="divide-y">
            {menteeAchievements.map((achievement) => (
              <div key={achievement._id} className="p-6">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="bg-amber-50 p-3 rounded-full">
                      <TrophyIcon className="w-6 h-6 text-amber-500" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-medium">
                        {achievement.type}
                      </h4>
                      <span className="text-sm text-gray-500">
                        {new Date(
                          achievement.dateOfAchievement
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-1 text-gray-700">
                      {achievement.description}
                    </p>
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {achievement.position}
                      </span>
                    </div>
                    {achievement.certificateUrl && (
                      <a
                        href={achievement.certificateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center text-sm text-primary hover:underline"
                      >
                        View Certificate
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderIssuesTab = () => {
    if (menteeIssues.length === 0) {
      return (
        <div className="text-center py-16">
          <p className="text-gray-500">No issues reported yet</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <h3 className="text-lg font-semibold p-6 border-b">Issues List</h3>
          <div className="divide-y">
            {menteeIssues.map((issue) => (
              <div key={issue._id} className="p-6">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div
                      className={`p-3 rounded-full ${
                        issue.status === "Resolved"
                          ? "bg-green-50 text-green-500"
                          : issue.status === "Under Review"
                          ? "bg-amber-50 text-amber-500"
                          : "bg-red-50 text-red-500"
                      }`}
                    >
                      <ClipboardDocumentListIcon className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-medium">{issue.issueType}</h4>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          issue.status === "Resolved"
                            ? "bg-green-100 text-green-800"
                            : issue.status === "Under Review"
                            ? "bg-amber-100 text-amber-800"
                            : issue.status === "Closed"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {issue.status}
                      </span>
                    </div>
                    <p className="mt-1 text-gray-700">{issue.description}</p>
                    <div className="mt-3 flex items-center space-x-2">
                      <span className="text-sm text-gray-500">
                        Reported on{" "}
                        {new Date(issue.createdAt).toLocaleDateString()}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Comments: {issue.comments?.length || 0}
                      </span>
                    </div>
                    <button
                      onClick={() => router.push(`/mentor/issues/${issue._id}`)}
                      className="mt-3 inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <button
          onClick={() => router.push("/mentor/mentees")}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1" />
          Back to Mentees
        </button>
        {menteeProfile && (
          <h1 className="text-2xl font-bold">
            {menteeProfile.name || "Mentee Details"}
          </h1>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b flex overflow-x-auto">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-6 py-3 text-sm font-medium flex items-center whitespace-nowrap ${
              activeTab === "profile"
                ? "border-b-2 border-primary text-primary"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <UserIcon className="w-5 h-5 mr-2" />
            Profile
          </button>
          <button
            onClick={() => setActiveTab("academics")}
            className={`px-6 py-3 text-sm font-medium flex items-center whitespace-nowrap ${
              activeTab === "academics"
                ? "border-b-2 border-primary text-primary"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <AcademicCapIcon className="w-5 h-5 mr-2" />
            Academics
          </button>
          <button
            onClick={() => setActiveTab("achievements")}
            className={`px-6 py-3 text-sm font-medium flex items-center whitespace-nowrap ${
              activeTab === "achievements"
                ? "border-b-2 border-primary text-primary"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <TrophyIcon className="w-5 h-5 mr-2" />
            Achievements
            {menteeAchievements.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-800">
                {menteeAchievements.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("issues")}
            className={`px-6 py-3 text-sm font-medium flex items-center whitespace-nowrap ${
              activeTab === "issues"
                ? "border-b-2 border-primary text-primary"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <ClipboardDocumentListIcon className="w-5 h-5 mr-2" />
            Issues
            {menteeIssues.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800">
                {menteeIssues.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">{renderTabContent()}</div>
      </div>
    </div>
  );
}
