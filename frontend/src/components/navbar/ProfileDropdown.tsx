"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import clsx from "clsx";
import Image from "next/image";

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
        className="focus:outline-none relative w-9 h-9"
        title="Profile menu"
      >
        <div className="relative w-8 h-8 md:w-9 md:h-9">
          <Image
            src={(user.avatar ? `${user.avatar}?t=${Date.now()}` : "/static/avatars/default.jpg")}
            alt="Profile picture"
            className="rounded-full border object-cover"
            fill
            sizes="(max-width: 768px) 32px, 36px"
            priority
            unoptimized={true}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = "/static/avatars/default.jpg";
            }}
          />
        </div>
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
