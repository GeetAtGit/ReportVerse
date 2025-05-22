"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  UserIcon,
  ClipboardDocumentListIcon,
  AcademicCapIcon,
  TrophyIcon,
  UsersIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  userRole: string;
};

// Mentee Sidebar Items
const menteeMenuItems = [
  {
    name: "Dashboard",
    href: "/mentee/dashboard",
    icon: HomeIcon,
  },
  {
    name: "Profile",
    href: "/mentee/profile",
    icon: UserIcon,
  },
  {
    name: "Academic Records",
    href: "/mentee/academics",
    icon: AcademicCapIcon,
  },
  {
    name: "Issues",
    href: "/mentee/issues",
    icon: ClipboardDocumentListIcon,
  },
  {
    name: "Achievements",
    href: "/mentee/achievements",
    icon: TrophyIcon,
  },
];

// Mentor Sidebar Items
const mentorMenuItems = [
  {
    name: "Dashboard",
    href: "/mentor/dashboard",
    icon: HomeIcon,
  },
  {
    name: "Mentees",
    href: "/mentor/mentees",
    icon: UsersIcon,
  },
  {
    name: "Issues",
    href: "/mentor/issues",
    icon: ClipboardDocumentListIcon,
  },
  {
    name: "Achievements",
    href: "/mentor/achievements",
    icon: TrophyIcon,
  },
];

// Mentee-specific sidebar
function MenteeSidebar({ isOpen, onClose }: Omit<SidebarProps, "userRole">) {
  return <SidebarLayout isOpen={isOpen} onClose={onClose} menuItems={menteeMenuItems} userRole="mentee" />;
}

// Mentor-specific sidebar
function MentorSidebar({ isOpen, onClose }: Omit<SidebarProps, "userRole">) {
  return <SidebarLayout isOpen={isOpen} onClose={onClose} menuItems={mentorMenuItems} userRole="mentor" />;
}

// Common sidebar layout
function SidebarLayout({ 
  isOpen, 
  onClose, 
  menuItems, 
  userRole 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  menuItems: Array<{ name: string; href: string; icon: any; }>; 
  userRole: string;
}) {
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node) &&
        isOpen
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close sidebar on window resize (mobile -> desktop)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isOpen) {
        onClose();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Mobile close button */}
        <button className="absolute top-4 right-4 md:hidden" onClick={onClose}>
          <XMarkIcon className="w-6 h-6 text-gray-500 hover:text-gray-700" />
        </button>

        {/* Sidebar header */}
        <div className="p-4 border-b">
          <Link
            href={`/${userRole}/dashboard`}
            className="flex items-center space-x-2"
          >
            <span className="text-xl font-bold text-primary">ReportVerse</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive =
              pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  isActive
                    ? "bg-primary text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}

// Main Sidebar component that determines which sidebar to show based on role
export default function Sidebar({ isOpen, onClose, userRole }: SidebarProps) {
  if (userRole === "mentor") {
    return <MentorSidebar isOpen={isOpen} onClose={onClose} />;
  }
  
  return <MenteeSidebar isOpen={isOpen} onClose={onClose} />;
}
