"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { mentorApi } from "@/services/api";
import {
  ClipboardDocumentListIcon,
  UserIcon,
  ArrowLeftIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { showToast, trackPromise } from "@/components/ui/CustomToasts";

interface IssueDetails {
  _id: string;
  title: string;
  description: string;
  status: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  mentee: {
    _id: string;
    email: string;
  };
  comments: {
    _id: string;
    user: {
      _id: string;
      email: string;
      role: string;
    };
    text: string;
    createdAt: string;
  }[];
}

export default function IssueDetailsPage({
  params,
}: {
  params: { issueId: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [issue, setIssue] = useState<IssueDetails | null>(null);
  const [comment, setComment] = useState("");
  const [newStatus, setNewStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [newCommentId, setNewCommentId] = useState<string | null>(null);

  // Comment validation
  const MIN_COMMENT_LENGTH = 3;
  const MAX_COMMENT_LENGTH = 1000;
  const isCommentValid =
    comment.trim().length >= MIN_COMMENT_LENGTH &&
    comment.length <= MAX_COMMENT_LENGTH;

  // Status options
  const statusOptions = ["Open", "Under Review", "Resolved", "Closed"];

  useEffect(() => {
    fetchIssueDetails();
  }, []);

  const fetchIssueDetails = async () => {
    setLoading(true);

    try {
      const response = await trackPromise(mentorApi.getIssue(params.issueId), {
        loading: "Loading issue details...",
        success: "Issue details loaded",
        error: "Failed to load issue details",
      });

      setIssue(response.data.data);
      setNewStatus(response.data.data.status);
    } catch (error) {
      console.error("Error fetching issue details:", error);
      // Error already handled by trackPromise
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!comment.trim()) {
      showToast.error("Comment cannot be empty");
      return;
    }

    if (!isCommentValid) {
      showToast.error(
        `Comment must be between ${MIN_COMMENT_LENGTH} and ${MAX_COMMENT_LENGTH} characters`
      );
      return;
    }

    setIsSubmitting(true);

    // Use our custom promise tracking
    try {
      const response = await trackPromise(
        mentorApi.addComment(params.issueId, {
          text: comment,
          status: newStatus,
        }),
        {
          loading: "Submitting your response...",
          success:
            issue?.status !== newStatus
              ? `Status updated to "${newStatus}" and comment added`
              : "Comment added successfully",
          error: "Failed to add comment",
        }
      );

      if (response.data && response.data.success) {
        const updatedIssue = response.data.data;

        // Get the ID of the newly added comment (latest comment)
        const newComment =
          updatedIssue.comments[updatedIssue.comments.length - 1];
        setNewCommentId(newComment._id);

        // Clear the highlight after 3 seconds
        setTimeout(() => {
          setNewCommentId(null);
        }, 3000);

        setIssue(updatedIssue);
        setComment("");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      // Error is already handled by trackPromise
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = (status: string) => {
    // For Resolved or Closed status, show confirmation if changing from a different status
    if (
      (status === "Resolved" || status === "Closed") &&
      issue?.status !== status
    ) {
      setPendingStatus(status);
      setShowStatusConfirm(true);
    } else {
      // For other statuses, update immediately
      setNewStatus(status);
    }
  };

  const confirmStatusChange = () => {
    if (pendingStatus) {
      setNewStatus(pendingStatus);
      setShowStatusConfirm(false);
      setPendingStatus(null);
    }
  };

  const cancelStatusChange = () => {
    setShowStatusConfirm(false);
    setPendingStatus(null);
  };

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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-2 text-gray-500">Loading issue details...</p>
        </div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Issue not found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            The issue you are looking for does not exist or you don't have
            permission to view it.
          </p>
          <button
            onClick={() => router.push("/mentor/issues")}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90"
          >
            Go back to Issues
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1" />
          Back to Issues
        </button>
        <span
          className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(
            issue.status
          )}`}
        >
          {issue.status}
        </span>
      </div>

      {/* Issue Details */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="bg-red-100 p-4 rounded-full">
              <ClipboardDocumentListIcon className="w-7 h-7 text-red-500" />
            </div>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{issue.title}</h1>
            <div className="flex items-center mt-2 space-x-4">
              <div className="flex items-center text-sm text-gray-500">
                <UserIcon className="w-4 h-4 mr-1" />
                <span>{issue.mentee.email}</span>
              </div>
              <div className="text-sm text-gray-500">
                {new Date(issue.createdAt).toLocaleString()}
              </div>
              <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {issue.category}
              </div>
            </div>
            <div className="mt-4 bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 whitespace-pre-line">
                {issue.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Comments */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <h2 className="text-lg font-semibold p-6 border-b">Comments</h2>
        <div className="divide-y">
          {issue.comments && issue.comments.length > 0 ? (
            issue.comments.map((comment) => (
              <div
                key={comment._id}
                className={`p-6 transition-colors duration-500 ${
                  newCommentId === comment._id ? "bg-green-50" : ""
                }`}
              >
                <div className="flex space-x-3">
                  <div
                    className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                      comment.user.role === "mentor"
                        ? "bg-blue-100"
                        : "bg-green-100"
                    }`}
                  >
                    <UserIcon
                      className={`h-5 w-5 ${
                        comment.user.role === "mentor"
                          ? "text-blue-500"
                          : "text-green-500"
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">
                        {comment.user.email}
                        <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-800 capitalize">
                          {comment.user.role}
                        </span>
                      </h4>
                      <span className="text-sm text-gray-500">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-700 whitespace-pre-line">
                      {comment.text}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500">No comments yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Comment Form */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Add a Comment</h2>
        <form onSubmit={handleSubmitComment}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="comment"
                className="block text-sm font-medium text-gray-700"
              >
                Your Comment
              </label>
              <textarea
                id="comment"
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className={`mt-1 block w-full border ${
                  comment.trim() && !isCommentValid
                    ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300 focus:ring-primary focus:border-primary"
                } rounded-md shadow-sm p-3 focus:outline-none sm:text-sm`}
                placeholder="Enter your comment here..."
                maxLength={MAX_COMMENT_LENGTH}
                required
              ></textarea>
              <div className="mt-1 flex justify-between text-sm">
                <div>
                  {comment.trim() &&
                    comment.trim().length < MIN_COMMENT_LENGTH && (
                      <p className="text-red-500">
                        Comment must be at least {MIN_COMMENT_LENGTH} characters
                      </p>
                    )}
                </div>
                <div
                  className={`${
                    comment.length > MAX_COMMENT_LENGTH * 0.9
                      ? "text-red-500"
                      : "text-gray-500"
                  }`}
                >
                  {comment.length}/{MAX_COMMENT_LENGTH}
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700"
              >
                Update Status
              </label>
              <div className="mt-1 flex flex-wrap gap-2">
                {statusOptions.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleStatusChange(status)}
                    className={`px-3 py-1 text-sm font-medium rounded-full flex items-center ${
                      newStatus === status
                        ? `${getStatusColor(
                            status
                          )} ring-2 ring-offset-2 ring-${
                            status === "Open"
                              ? "red"
                              : status === "Under Review"
                              ? "amber"
                              : status === "Resolved"
                              ? "green"
                              : "gray"
                          }-400`
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {newStatus === status && (
                      <CheckCircleIcon className="w-4 h-4 mr-1" />
                    )}
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !isCommentValid}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="w-4 h-4 mr-2" />
                    Submit Comment
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Status Change Confirmation Dialog */}
      {showStatusConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Confirm Status Change</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to mark this issue as "{pendingStatus}"?
              {pendingStatus === "Resolved"
                ? " This indicates that the issue has been addressed."
                : " This will close the issue and prevent further comments."}
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={cancelStatusChange}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusChange}
                className={`px-4 py-2 border border-transparent rounded-md text-white ${
                  pendingStatus === "Resolved"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-gray-600 hover:bg-gray-700"
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
