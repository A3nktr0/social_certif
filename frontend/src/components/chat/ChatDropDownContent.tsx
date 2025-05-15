"use client";

import { useAuth } from "@/context/AuthContext";
import { usePresence } from "@/hooks/usePresence";
import { useChat } from "@/hooks/useChat";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { ChatUser } from "@/types/user";
import { useGroupsChat } from "@/hooks/useGroupsChat";
import clsx from "clsx";
import { X } from "lucide-react";

export default function ChatDropdownContent() {
  const { user } = useAuth();
  const { startPrivateChat, startGroupChat } = useChat();
  const { triggerUpdate, onlineStatus } = usePresence(user?.id);
  const [mutuals, setMutuals] = useState<ChatUser[]>([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const groups = useGroupsChat();

  useEffect(() => {
    if (open) {
      axios
        .get("/api/chat/mutuals", { withCredentials: true })
        .then((res) => setMutuals(res.data || []))
        .catch(() => setMutuals([]));
    }
  }, [open, triggerUpdate]);

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

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="focus:outline-none"
        title="Open chat menu"
      >
        <svg
          className="w-6 h-6 text-gray-700 hover:text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
          />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
          {/* Tap-outside backdrop */}
          <div className="absolute inset-0 bg-black/30 sm:bg-transparent" />

          {/* Chat content container */}
          <div
            ref={dropdownRef}
            className={clsx(
              "absolute right-2 top-12 w-[90vw] sm:w-72 max-w-sm bg-white border border-gray-200 rounded-lg shadow-lg z-50",
              "max-h-[75vh] overflow-hidden flex flex-col"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile header */}
            <div className="flex items-center justify-between px-4 py-2 border-b sm:hidden">
              <h2 className="text-sm font-semibold text-gray-800">Chats</h2>
              <button onClick={() => setOpen(false)}>
                <X className="w-5 h-5 text-gray-600 hover:text-red-500" />
              </button>
            </div>

            <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(75vh-2.5rem)]">
              {/* Online Mutuals */}
              <div>
                <h3 className="text-sm font-semibold mb-2 text-gray-700">Online Mutuals</h3>
                <ul className="space-y-1">
                  {mutuals.length === 0 ? (
                    <li className="text-xs text-gray-400">Nobody online</li>
                  ) : (
                    mutuals.map((u) => {
                      const isOnline = onlineStatus[u.id];
                      return (
                        <li
                          key={u.id}
                          className="flex items-center gap-2 text-sm text-blue-600 hover:underline cursor-pointer"
                          onClick={() => {
                            startPrivateChat(u.id);
                            setOpen(false);
                          }}
                        >
                          <span
                            className={clsx(
                              "w-2 h-2 rounded-full",
                              isOnline ? "bg-green-500" : "bg-gray-300"
                            )}
                          />
                          {u.nickname}
                        </li>
                      );
                    })
                  )}
                </ul>
              </div>

              {/* Group Chats */}
              <div>
                <h3 className="text-sm font-semibold mb-2 text-gray-700">My Groups</h3>
                <ul className="space-y-1">
                  {groups.length === 0 ? (
                    <li className="text-xs text-gray-400">No groups yet</li>
                  ) : (
                    groups.map((group) => (
                      <li
                        key={group.id}
                        className="text-sm text-green-600 hover:underline cursor-pointer"
                        onClick={() => {
                          startGroupChat(group.id);
                          setOpen(false);
                        }}
                      >
                        {group.name}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
