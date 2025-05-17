"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { offChannel, onChannel, WSMessage } from "@/lib/services/ws";
import axios from "axios";
import Image from "next/image";

interface Props {
  type: "private" | "group";
  targetId: string;
  onClose: () => void;
}

export default function ChatHeader({ type, targetId, onClose }: Props) {
  const [name, setName] = useState("...");
  const [avatar, setAvatar] = useState("/static/avatars/default.jpg");
  const [online, setOnline] = useState(false);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const endpoint = type === "private"
          ? `/api/profile/${targetId}`
          : `/api/groups/${targetId}`;
        const res = await axios.get(endpoint, {
          withCredentials: true,
        });
        const data = res.data;
        setName(
          type === "private" ? data.nickname || data.first_name : data.name,
        );
        setAvatar(data.avatar || "/static/avatars/default.jpg");
      } catch  {
        console.error("Failed to fetch chat metadata");
        // Keep default values on error
      }
    };
    fetchMeta();
  }, [type, targetId]);

  useEffect(() => {
    if (type !== "private") return;
    const handle = (msg: WSMessage) => {
      if (msg.channel === "presence") {
        const data = msg.data as { user_id: string; online: boolean };
        if (data.user_id === targetId) {
          setOnline(data.online ?? false);
        }
      }
    };
    onChannel("presence", handle);
    return () => offChannel("presence", handle);
  }, [type, targetId]);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
      <div className="flex items-center gap-3">
        <div className="relative w-8 h-8">
          <Image
            src={avatar}
            alt={`${name}'s avatar`}
            className="rounded-full border object-cover"
            fill
            sizes="32px"
            priority
            unoptimized={true}
            onError={(e) => {
              // Fallback to default image if there's an error loading the user avatar
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = "/static/avatars/default.jpg";
            }}
          />
          {type === "private" && online && (
            <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border border-white rounded-full" />
          )}
        </div>
        <span className="font-medium text-sm text-gray-800 truncate">
          {name}
        </span>
      </div>
      <button onClick={onClose} className="text-gray-500 hover:text-red-500">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
