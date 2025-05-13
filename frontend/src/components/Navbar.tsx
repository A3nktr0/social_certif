"use client";

import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import NotificationDropdown from "@/components/notifications/NotificationDropdown";
import { Plus } from "lucide-react";
import ChatDropdownContent from "@/components/chat/ChatDropDownContent";

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // inside Navbar component (useState block):
  const [chatOpen, setChatOpen] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  // update outside-click effect to include chat dropdown:
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        chatRef.current && !chatRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setChatOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const {
    unreadCount,
    decrement: decrementNotif,
    set: setUnreadCount,
  } = useNotifications(user?.id);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading || !user) return null;

  return (
    <>
      <nav className="bg-white border-b border-gray-200 shadow-sm px-6 py-3 flex items-center justify-between">
        <div className="text-xl font-bold text-blue-600 tracking-tight">
          MySocial
        </div>

        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="hover:text-blue-600 transition text-gray-800"
          >
            Dashboard
          </Link>
          <Link
            href="/feed"
            className="hover:text-blue-600 transition text-gray-800"
          >
            Feed
          </Link>
          <Link
            href="/groups"
            className="hover:text-blue-600 transition text-gray-800"
          >
            Groups
          </Link>
          <Link
            href="/explore"
            className="hover:text-blue-600 transition text-gray-800"
          >
            Explore
          </Link>
        </div>

        <div className="flex items-center gap-6">
          <NotificationDropdown
            decrementBadge={decrementNotif}
            unreadCount={unreadCount}
          />

          <div className="relative" ref={chatRef}>
            <button
              onClick={() => setChatOpen((prev) => !prev)}
              className="hover:text-blue-600 transition text-gray-800"
              title="Chat"
            >
              <MessageCircle className="w-6 h-6" />
            </button>
            {chatOpen && (
              <div className="absolute right-0 mt-2 z-50">
                <ChatDropdownContent />
              </div>
            )}
          </div>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-2 focus:outline-none"
            >
              <img
                src={`${user.avatar}?t=${Date.now()}` ||
                  "/static/avatars/default.jpg"}
                alt="avatar"
                className="w-9 h-9 rounded-full border object-cover"
              />
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <Link
                  href={`/profile/${user.id}`}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Floating Create Post Button */}
      <Link
        href="/post/create"
        className="fixed bottom-6 right-6 z-40 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition"
        title="Create Post"
      >
        <Plus className="w-6 h-6" />
      </Link>
    </>
  );
}
