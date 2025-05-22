"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Loading from "@/components/ui/Loading";
import IssueNotifications from "./mentor/issues/components/IssueNotifications";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Check authentication
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/login";
    }
  }, [isLoading, isAuthenticated]);

  // Log user role for debugging
  useEffect(() => {
    if (user) {
      console.log("Current user role:", user.role);
    }
  }, [user]);

  // Show loading screen while auth check is in progress
  if (isLoading) {
    return <Loading />;
  }

  // If not authenticated, don't render anything (will redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

  // Force refresh local user data from localStorage
  const userRole = pathname?.startsWith("/mentor") ? "mentor" : "mentee";

  console.log("Path-based role:", userRole);
  console.log("User object role:", user.role);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - explicitly use the userRole based on current path */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        userRole={userRole}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <Header user={user} onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
        {user?.role === "mentor" && <IssueNotifications />}
      </div>
    </div>
  );
}
