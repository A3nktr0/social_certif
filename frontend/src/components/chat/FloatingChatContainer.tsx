"use client";

import { useChatContext } from "./ChatManager";
import ChatWindow from "@/components/chat/ChatWindow";

export default function FloatingChatContainer() {
  const { openChats } = useChatContext();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex gap-4">
      {openChats.map((chat) => (
        <ChatWindow
          key={`${chat.type}-${chat.id}`}
          type={chat.type}
          targetId={chat.id}
        />
      ))}
    </div>
  );
}
