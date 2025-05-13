"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { offChannel, onChannel } from "@/lib/services/ws";
import axios from "axios";

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
    };
    fetchMeta();
  }, [type, targetId]);

  useEffect(() => {
    if (type !== "private") return;
    const handle = (msg: any) => {
      if (msg.channel === "presence" && msg.from === targetId) {
        setOnline(msg.data?.online ?? false);
      }
    };
    onChannel("presence", handle);
    return () => offChannel("presence", handle);
  }, [type, targetId]);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
      <div className="flex items-center gap-3">
        <div className="relative">
          <img
            src={avatar}
            className="w-8 h-8 rounded-full border object-cover"
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
