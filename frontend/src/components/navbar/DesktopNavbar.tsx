"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationDropdown from "@/components/notifications/NotificationDropdown";
import ChatDropdownContent from "@/components/chat/ChatDropDownContent";
import ProfileDropdown from "@/components/navbar/ProfileDropdown";
import CreatePostButton from "@/components/posts/CreatePostButton";

export default function DesktopNavbar() {
  const { user } = useAuth();
  const { unreadCount, decrement: decrementNotif } = useNotifications(user?.id);

  if (!user) return null;

  return (
    <>
      <nav className="hidden md:flex justify-between items-center bg-white border-b border-gray-200 shadow-sm px-6 py-3 sticky top-0 z-20">
        <div className="text-xl font-bold text-blue-600 tracking-tight">
          MySocial
        </div>

        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="hover:text-blue-600 text-gray-800">
            Dashboard
          </Link>
          <Link href="/feed" className="hover:text-blue-600 text-gray-800">
            Feed
          </Link>
          <Link href="/groups" className="hover:text-blue-600 text-gray-800">
            Groups
          </Link>
          <Link href="/explore" className="hover:text-blue-600 text-gray-800">
            Explore
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <NotificationDropdown
            decrementBadge={decrementNotif}
            unreadCount={unreadCount}
          />

          <ChatDropdownContent />

          <ProfileDropdown />
        </div>
      </nav>
      <CreatePostButton />
    </>
  );
}
