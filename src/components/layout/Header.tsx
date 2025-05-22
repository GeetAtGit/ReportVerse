"use client";

import { useAuth } from "@/lib/auth";
import {
  Bars3Icon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

interface User {
  id: string;
  name?: string;
  email: string;
  role: string;
}

interface HeaderProps {
  user: User;
  onMenuClick: () => void;
}

export default function Header({ user, onMenuClick }: HeaderProps) {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-white border-b px-4 py-2 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Left section with mobile menu button */}
        <div className="flex items-center">
          <button
            type="button"
            className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            onClick={onMenuClick}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>

        {/* Right section with user name and logout */}
        <div className="flex items-center space-x-4">
          {/* User name (text only) */}
          <div className="flex flex-col text-right">
            <span className="text-sm font-medium text-gray-900">
              {user.name || user.email}
            </span>
            <span className="text-xs text-gray-500 capitalize">
              {user.role}
            </span>
          </div>

          {/* Logout button as CTA */}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors font-medium"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
