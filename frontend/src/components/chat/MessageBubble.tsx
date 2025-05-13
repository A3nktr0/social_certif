"use client";

import { useAuth } from "@/context/AuthContext";
import { Message } from "@/types/message";
import clsx from "clsx";

interface Props {
  msg: Message;
  type: "private" | "group";
  displayName: string | "";
}

export default function MessageBubble({ msg, type, displayName }: Props) {
  const { user } = useAuth();
  const isMine = msg.sender_id === user?.id;

  return (
    <div className={clsx("flex flex-col", isMine ? "items-end" : "items-start")}>
      {/* Show sender name only in group chat and if not mine */}
      {!isMine && type === "group" && (
        <span className="text-xs text-gray-500 mb-1 ml-2">{displayName}</span>
      )}

      <div
        className={clsx(
          "max-w-[80%] px-4 py-2 rounded-2xl text-sm shadow break-words whitespace-pre-wrap",
          isMine
            ? "bg-blue-500 text-white rounded-br-none"
            : "bg-gray-100 text-gray-900 rounded-bl-none",
          msg.is_emoji_only && "text-4xl bg-transparent shadow-none px-2 py-1",
        )}
        style={
          msg.is_emoji_only
            ? { fontFamily: "Apple Color Emoji, Segoe UI Emoji" }
            : {}
        }
      >
        {msg.content}
      </div>
    </div>
  );
}
