"use client";

import { useAuth } from "@/context/AuthContext";
import { usePresence } from "@/hooks/usePresence";
import { useChat } from "@/hooks/useChat";
import { useEffect, useState } from "react";
import axios from "axios";
import { ChatUser } from "@/types/user";
import { useGroupsChat } from "@/hooks/useGroupsChat";
import clsx from "clsx";

export default function ChatDropdownContent() {
  const { user } = useAuth();
  const { startPrivateChat, startGroupChat } = useChat();
  const { triggerUpdate, onlineStatus } = usePresence(user?.id);
  const [mutuals, setMutuals] = useState<ChatUser[]>([]);
  const groups = useGroupsChat();
//   const chatUsers = useMutualFollowers(user?.id);

  useEffect(() => {
    axios
      .get("/api/chat/mutuals", { withCredentials: true })
      .then((res) => setMutuals(res.data || []))
      .catch(() => setMutuals([]));
  }, [triggerUpdate]);

  if (!user) return null;

  return (
    <div className="w-64 p-4 bg-white border rounded-lg shadow space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-2 text-gray-700">Online Mutuals</h3>
        <ul className="space-y-1 max-h-40 overflow-y-auto">
          {mutuals.length === 0 ? (
            <li className="text-xs text-gray-400">Nobody online</li>
          ) : (
            mutuals.map((u) => {
              const isOnline = onlineStatus[u.id];

              return (
                <li
                  key={u.id}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline cursor-pointer"
                  onClick={() => startPrivateChat(u.id)}
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

      <div>
        <h3 className="text-sm font-semibold mb-2 text-gray-700">My Groups</h3>
        <ul className="space-y-1 max-h-40 overflow-y-auto">
          {groups.length === 0 ? (
            <li className="text-xs text-gray-400">No groups yet</li>
          ) : (
            groups.map((group) => (
              <li
                key={group.id}
                className="text-sm text-green-600 hover:underline cursor-pointer"
                onClick={() => startGroupChat(group.id)}
              >
                {group.name}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
