"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  XCircleIcon,
  UserCircleIcon,
  ChatBubbleLeftIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

// Interface aligned with the backend Issue model
interface Comment {
  _id: string;
  user: {
    _id: string;
    email: string;
    role: string;
  };
  text: string;
  createdAt: string;
}

interface Issue {
  _id: string;
  issueType: string; // enum: ['Academic', 'Grievances', 'Ragging', 'Harassment', 'Accommodation', 'Other']
  description: string;
  status: string; // enum: ['Open', 'Under Review', 'Resolved', 'Closed']
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

export default function IssueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const issueId = params.issueId as string;

  const [issueData, setIssueData] = useState<Issue | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    async function fetchIssueDetail() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
          }/mentee/issues/${issueId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Error fetching issue: ${response.statusText}`);
        }

        const result = await response.json();
        if (result.success) {
          setIssueData(result.data);
        } else {
          throw new Error(result.error || "Failed to load issue details");
        }
      } catch (error) {
        console.error("Failed to fetch issue:", error);
        setError("Failed to load issue details. Please try again.");
        toast.error("Failed to load issue details");
      } finally {
        setIsLoading(false);
      }
    }

    if (issueId) {
      fetchIssueDetail();
    }
  }, [issueId]);

  // Get status badge based on issue status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Open":
        return (
          <span className="px-3 py-1 text-sm rounded-full bg-red-100 text-red-800 flex items-center">
            <ExclamationCircleIcon className="w-4 h-4 mr-2" />
            Open
          </span>
        );
      case "Under Review":
        return (
          <span className="px-3 py-1 text-sm rounded-full bg-blue-100 text-blue-800 flex items-center">
            <ClockIcon className="w-4 h-4 mr-2" />
            Under Review
          </span>
        );
      case "Resolved":
        return (
          <span className="px-3 py-1 text-sm rounded-full bg-green-100 text-green-800 flex items-center">
            <CheckCircleIcon className="w-4 h-4 mr-2" />
            Resolved
          </span>
        );
      case "Closed":
        return (
          <span className="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-800 flex items-center">
            <XCircleIcon className="w-4 h-4 mr-2" />
            Closed
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-800">
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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Handle new comment submission
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    setIsSubmittingComment(true);

    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
        }/mentee/issues/${issueId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ text: newComment }),
        }
      );

      if (!response.ok) {
        throw new Error(`Error adding comment: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success) {
        toast.success("Comment added successfully");
        setNewComment("");

        // Refresh issue data to show the new comment
        if (issueData) {
          setIssueData({
            ...issueData,
            comments: [...issueData.comments, result.data],
            updatedAt: new Date().toISOString(),
          });
        }
      } else {
        throw new Error(result.error || "Failed to add comment");
      }
    } catch (error) {
      console.error("Failed to add comment:", error);
      toast.error("Failed to add comment. Please try again.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <button
          onClick={() => router.push("/mentee/issues")}
          className="mr-4 flex items-center text-gray-500 hover:text-gray-700 transition"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Issues
        </button>
        <h1 className="text-2xl font-bold">Issue Details</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
          <p className="flex items-center">
            <ExclamationCircleIcon className="h-5 w-5 mr-2" />
            {error}
          </p>
          <button
            onClick={() => router.push("/mentee/issues")}
            className="mt-4 px-4 py-2 bg-white border border-red-300 text-red-700 rounded hover:bg-red-50 transition"
          >
            Return to Issues
          </button>
        </div>
      ) : issueData ? (
        <div className="space-y-6">
          {/* Issue Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
              <div className="flex-1">
                <div className="text-sm text-gray-500 mb-1">Issue Type</div>
                <div className="text-lg font-semibold">
                  {issueData.issueType}
                </div>
              </div>
              <div>{getStatusBadge(issueData.status)}</div>
            </div>

            <div className="mb-6">
              <div className="text-sm text-gray-500 mb-1">Description</div>
              <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                {issueData.description}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Date Reported:</span>{" "}
                {formatDate(issueData.createdAt)}
              </div>
              <div>
                <span className="text-gray-500">Last Updated:</span>{" "}
                {formatDate(issueData.updatedAt)}
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <ChatBubbleLeftIcon className="h-5 w-5 mr-2 text-primary" />
              Comments &amp; Updates
            </h2>

            {issueData.comments && issueData.comments.length > 0 ? (
              <div className="space-y-4">
                {issueData.comments.map((comment) => (
                  <div key={comment._id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <UserCircleIcon className="h-5 w-5 mr-2 text-gray-500" />
                        <span className="font-medium">
                          {comment.user.role === "mentor"
                            ? "Mentor: "
                            : "You: "}
                          {comment.user.email}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(comment.createdAt)}
                      </div>
                    </div>
                    <div className="text-gray-700 ml-7">{comment.text}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No comments yet. Your mentor will respond to your issue soon.
              </div>
            )}

            {/* Add Comment Form */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-md font-medium mb-3">Add a Comment</h3>
              <form onSubmit={handleCommentSubmit}>
                <div className="mb-3">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary focus:border-primary"
                    rows={3}
                    placeholder="Enter your comment here..."
                    disabled={
                      isSubmittingComment || issueData.status === "Closed"
                    }
                  ></textarea>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition flex items-center"
                    disabled={
                      isSubmittingComment ||
                      !newComment.trim() ||
                      issueData.status === "Closed"
                    }
                  >
                    {isSubmittingComment ? (
                      <>
                        <span className="mr-2">Submitting...</span>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white"></div>
                      </>
                    ) : (
                      "Submit Comment"
                    )}
                  </button>
                </div>
                {issueData.status === "Closed" && (
                  <p className="text-sm text-red-500 mt-2">
                    This issue is closed. You cannot add new comments.
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="flex flex-col items-center justify-center space-y-4">
            <ExclamationCircleIcon className="h-16 w-16 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900">
              Issue not found
            </h3>
            <p className="text-gray-500">
              The issue you're looking for doesn't exist or you don't have
              permission to view it.
            </p>
            <button
              onClick={() => router.push("/mentee/issues")}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition"
            >
              Back to Issues
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
