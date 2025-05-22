"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/ui/CustomToasts";
import { mentorApi } from "@/services/api";

// Set the threshold in days for an issue to be considered pending for too long
const DAYS_THRESHOLD = 3;

interface IssueNotificationsProps {
  autoCheck?: boolean; // Whether to automatically check for pending issues
  checkInterval?: number; // How often to check in milliseconds
}

export default function IssueNotifications({
  autoCheck = true,
  checkInterval = 60 * 60 * 1000, // Default: check every hour
}: IssueNotificationsProps) {
  const router = useRouter();
  const [hasShownNotifications, setHasShownNotifications] = useState(false);

  useEffect(() => {
    if (autoCheck) {
      // Check immediately on mount
      checkPendingIssues();

      // Then set interval for regular checks
      const intervalId = setInterval(checkPendingIssues, checkInterval);

      // Clean up on unmount
      return () => clearInterval(intervalId);
    }
  }, [autoCheck, checkInterval]);

  const checkPendingIssues = async () => {
    try {
      // Don't show notifications more than once per session
      if (hasShownNotifications) {
        return;
      }

      const response = await mentorApi.getIssues();

      if (response.data.success) {
        const issues = response.data.data || [];

        // Find issues that have been open or under review for too long
        const oldPendingIssues = issues.filter((issue: any) => {
          // Only consider open or under review issues
          if (issue.status !== "Open" && issue.status !== "Under Review") {
            return false;
          }

          // Calculate how many days the issue has been pending
          const createdAt = new Date(issue.createdAt);
          const now = new Date();
          const diffTime = Math.abs(now.getTime() - createdAt.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          return diffDays >= DAYS_THRESHOLD;
        });

        // If there are pending issues, show a notification
        if (oldPendingIssues.length > 0) {
          showToast.info(
            `You have ${oldPendingIssues.length} issue${
              oldPendingIssues.length === 1 ? "" : "s"
            } pending for more than ${DAYS_THRESHOLD} days`,
            "Click to view and resolve them"
          );

          // Only show notifications once
          setHasShownNotifications(true);
        }
      }
    } catch (error) {
      console.error("Error checking pending issues:", error);
    }
  };

  // This component doesn't render anything visible
  return null;
}
