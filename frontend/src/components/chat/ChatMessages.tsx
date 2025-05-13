"use client";

import { Message } from "@/types/message";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "@components/chat/TypingIndicator";

interface Props {
  messages: Message[];
  isTyping: boolean;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  type: "private" | "group";
  displayName: string | "";
  typingName: string;
}

export default function ChatMessages({
  messages,
  isTyping,
  scrollRef,
  type,
  displayName,
  typingName,
}: Props) {
  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-3 py-2 space-y-2 bg-white"
    >
      {messages.map((msg, i) => (
        <MessageBubble
          key={i}
          msg={msg}
          type={type}
          displayName={displayName}
        />
      ))}
      {isTyping && (
        <TypingIndicator
          name={typingName}
        />
      )}
    </div>
  );
}
