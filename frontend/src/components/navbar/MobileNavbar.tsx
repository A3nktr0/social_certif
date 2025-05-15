"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Plus, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationDropdown from "@/components/notifications/NotificationDropdown";
import ChatDropdownContent from "@/components/chat/ChatDropDownContent";
import ProfileDropdown from "@/components/navbar/ProfileDropdown";

export default function MobileNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const { user } = useAuth();
  const { unreadCount, decrement: decrementNotif } = useNotifications(user?.id);

  return (
    <>
      <nav className="flex md:hidden items-center justify-between bg-white border-b border-gray-200 shadow-sm px-4 py-3">
        {/* Left: Logo & Hamburger */}
        <div className="flex items-center gap-3">
          <button onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen
              ? <X className="w-6 h-6 stroke-blue-600" />
              : <Menu className="w-6 h-6 stroke-blue-600" />}
          </button>
          <span className="text-lg font-bold text-blue-600">MySocial</span>
        </div>

        {/* Center: Create Post */}
        <Link
          href="/post/create"
          title="Create Post"
          className="text-blue-600 hover:text-blue-800"
        >
          <Plus className="w-6 h-6" />
        </Link>

        <div className="flex items-center gap-3">
          <NotificationDropdown
            unreadCount={unreadCount}
            decrementBadge={decrementNotif}
          />
          <ChatDropdownContent />
          <ProfileDropdown />
        </div>
      </nav>

      {/* Slide-out mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-2 space-y-2">
          <Link
            href="/dashboard"
            className="block text-gray-800 hover:text-blue-600"
          >
            Dashboard
          </Link>
          <Link
            href="/feed"
            className="block text-gray-800 hover:text-blue-600"
          >
            Feed
          </Link>
          <Link
            href="/groups"
            className="block text-gray-800 hover:text-blue-600"
          >
            Groups
          </Link>
          <Link
            href="/explore"
            className="block text-gray-800 hover:text-blue-600"
          >
            Explore
          </Link>
        </div>
      )}
    </>
  );
}
