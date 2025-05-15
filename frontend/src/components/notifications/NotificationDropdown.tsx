"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import NotificationItem from "./NotificationItem";
import { fetchNotifications } from "@/lib/services/notifications";
import { Notification } from "@/types/notification";
import clsx from "clsx";

interface NotificationDropdownProps {
  decrementBadge: () => void;
  unreadCount: number;
}

export default function NotificationDropdown({
  decrementBadge,
  unreadCount,
}: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchAndSet = async () => {
    try {
      const data = await fetchNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      setNotifications([]);
    }
  };

  useEffect(() => {
    if (open) fetchAndSet();
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRemove = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative focus:outline-none"
      >
        <div className="relative">
          <Bell className="w-6 h-6 text-gray-700 hover:text-blue-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </div>
      </button>

      {open && (
        
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
          {/* Backdrop for tap outside UX */}
          <div
            className="absolute inset-0 bg-transparent"
            aria-hidden="true"
          />

          {/* Actual dropdown */}
          <div
            className={clsx(
              "absolute right-2 top-12 w-[90vw] sm:w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50",
              "max-h-[75vh] overflow-hidden flex flex-col"
            )}
            onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
          >
            <div className="p-3 border-b text-sm font-semibold text-gray-800">
              Notifications
            </div>
            <ul className="overflow-y-auto px-1 py-2 flex-1 space-y-1">
              {notifications.length === 0 ? (
                <li className="p-4 text-gray-500 text-sm text-center">
                  No notifications
                </li>
              ) : (
                notifications.map((n) => (
                  <NotificationItem
                    key={n.id}
                    {...n}
                    onRemove={handleRemove}
                    onCountUpdate={decrementBadge}
                  />
                ))
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
