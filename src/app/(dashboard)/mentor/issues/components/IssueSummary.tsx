"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { mentorApi } from "@/services/api";
import { showToast, trackPromise } from "@/components/ui/CustomToasts";
import {
  ClipboardDocumentListIcon,
  ExclamationCircleIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

interface IssueCounts {
  open: number;
  underReview: number;
  resolved: number;
  closed: number;
  total: number;
}

interface IssueSummaryProps {
  refreshTrigger?: number; // Optional prop to trigger refresh from parent
}

export default function IssueSummary({
  refreshTrigger = 0,
}: IssueSummaryProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState<IssueCounts>({
    open: 0,
    underReview: 0,
    resolved: 0,
    closed: 0,
    total: 0,
  });

  useEffect(() => {
    // Reset loading and error states when refreshTrigger changes
    if (refreshTrigger > 0) {
      setLoading(true);
      setError(null);
    }

    fetchIssueCounts();
  }, [refreshTrigger]);

  const fetchIssueCounts = async () => {
    if (!loading && refreshTrigger === 0) {
      setLoading(true);
    }

    setError(null);

    try {
      const response = await mentorApi.getIssues();

      if (response.data.success) {
        const issues = response.data.data || [];

        // Calculate counts
        const counts: IssueCounts = {
          open: 0,
          underReview: 0,
          resolved: 0,
          closed: 0,
          total: issues.length,
        };

        issues.forEach((issue: any) => {
          switch (issue.status) {
            case "Open":
              counts.open++;
              break;
            case "Under Review":
              counts.underReview++;
              break;
            case "Resolved":
              counts.resolved++;
              break;
            case "Closed":
              counts.closed++;
              break;
          }
        });

        setCounts(counts);
      } else {
        throw new Error("Failed to fetch issues");
      }
    } catch (error) {
      console.error("Error fetching issue counts:", error);
      setError("Failed to load issue statistics");
      // Don't show a toast if this is a background refresh
      if (refreshTrigger === 0) {
        showToast.error("Could not load issue statistics");
      }
    } finally {
      setLoading(false);
    }
  };

  // Manually refresh the issue summary
  const handleRefresh = async () => {
    try {
      await trackPromise(fetchIssueCounts(), {
        loading: "Refreshing issue counts...",
        success: "Issue counts refreshed",
        error: "Failed to refresh issue counts",
      });
    } catch (error) {
      console.error("Error refreshing issues:", error);
      // Error is already handled by trackPromise
    }
  };

  const statusCards = [
    {
      label: "Open",
      count: counts.open,
      bgColor: "bg-red-50",
      textColor: "text-red-700",
      borderColor: "border-red-200",
      icon: <ExclamationCircleIcon className="w-5 h-5 text-red-500" />,
      onClick: () => router.push("/mentor/issues?status=Open"),
    },
    {
      label: "Under Review",
      count: counts.underReview,
      bgColor: "bg-amber-50",
      textColor: "text-amber-700",
      borderColor: "border-amber-200",
      icon: <ClockIcon className="w-5 h-5 text-amber-500" />,
      onClick: () => router.push("/mentor/issues?status=Under+Review"),
    },
    {
      label: "Resolved",
      count: counts.resolved,
      bgColor: "bg-green-50",
      textColor: "text-green-700",
      borderColor: "border-green-200",
      icon: <CheckCircleIcon className="w-5 h-5 text-green-500" />,
      onClick: () => router.push("/mentor/issues?status=Resolved"),
    },
    {
      label: "Closed",
      count: counts.closed,
      bgColor: "bg-gray-50",
      textColor: "text-gray-700",
      borderColor: "border-gray-200",
      icon: <XCircleIcon className="w-5 h-5 text-gray-500" />,
      onClick: () => router.push("/mentor/issues?status=Closed"),
    },
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 text-center text-red-500">
        <p>{error}</p>
        <button
          onClick={handleRefresh}
          className="text-primary text-sm mt-2 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center mb-4">
        <ClipboardDocumentListIcon className="w-5 h-5 text-primary mr-2" />
        <h3 className="text-lg font-medium">Issue Summary</h3>
        <span className="ml-auto text-sm text-gray-500">
          {counts.total} total issues
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statusCards.map((card) => (
          <button
            key={card.label}
            onClick={card.onClick}
            className={`${card.bgColor} ${card.textColor} border ${card.borderColor} rounded-lg p-3 flex flex-col items-center hover:opacity-90 transition-opacity`}
          >
            {card.icon}
            <span className="text-2xl font-bold mt-1">{card.count}</span>
            <span className="text-xs mt-1">{card.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
