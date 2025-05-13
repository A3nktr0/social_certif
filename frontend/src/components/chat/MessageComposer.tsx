"use client";

import { useState, useRef } from "react";
import { Smile, SendHorizonal } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ChatOutboundMessage } from "@/types/message";
import { socketSend } from "@/lib/services/ws";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";

interface Props {
  type: "private" | "group";
  targetId: string;
}

export default function MessageComposer({ type, targetId }: Props) {
  const [text, setText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { user } = useAuth();
  const typingRef = useRef(false);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  const sendTyping = (status: "typing" | "stop") => {
    if (!user) return;
    socketSend({
      channel: "chat",
      event: "typing",
      to: targetId,
      content: status,
      data: type === "group" ? { group_id: targetId } : undefined,
    });
  };

  const handleTyping = () => {
    if (!typingRef.current) {
      typingRef.current = true;
      sendTyping("typing");
    }

    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }

    typingTimeout.current = setTimeout(() => {
      typingRef.current = false;
      sendTyping("stop");
    }, 1500);
  };

  const handleSend = () => {
    const content = text.trim();
    if (!content || !user) return;

    const payload: ChatOutboundMessage = {
      channel: "chat",
      event: type === "private" ? "private_message" : "group_message",
      to: targetId,
      content,
      data: type === "group" ? { group_id: targetId } : undefined,
    };

    socketSend(payload);
    setText("");
    sendTyping("stop");
    typingRef.current = false;
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setText((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="relative flex items-center gap-2 bg-white border rounded-full px-3 py-2 shadow-sm">
      <button
        type="button"
        className="text-gray-500 hover:text-yellow-500"
        onClick={() => setShowEmojiPicker((prev) => !prev)}
      >
        <Smile className="w-5 h-5" />
      </button>

      {showEmojiPicker && (
        <div className="absolute bottom-12 left-0 z-10">
          <EmojiPicker onEmojiClick={handleEmojiClick} />
        </div>
      )}

      <input
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          handleTyping();
        }}
        placeholder="Message..."
        className="flex-1 text-gray-800 bg-transparent outline-none text-sm"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
      />

      <button
        onClick={handleSend}
        className="text-blue-600 hover:text-blue-800 transition"
      >
        <SendHorizonal className="w-5 h-5" />
      </button>
    </div>
  );
}
