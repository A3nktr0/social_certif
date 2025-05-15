"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import clsx from "clsx";

export default function ProfileDropdown() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="focus:outline-none"
        title="Profile menu"
      >
        <img
          src={`${user.avatar}?t=${Date.now()}` || "/static/avatars/default.jpg"}
          alt="avatar"
          className={clsx(
            "border object-cover",
            "w-8 h-8 md:w-9 md:h-9 rounded-full"
          )}
        />
      </button>

      {open && (
        <div
          className={clsx(
            "absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
          )}
        >
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
  );
}
