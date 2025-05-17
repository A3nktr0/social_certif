"use client";

import { useChat } from "@/hooks/useChat";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Message } from "@/types/message";
import { offChannel, onChannel, WSMessage } from "@/lib/services/ws";
import MessageComposer from "./MessageComposer";
import ChatHeader from "@/components/chat/ChatHeader";
import ChatMessages from "@/components/chat/ChatMessages";
import axios from "axios";

interface Props {
  type: "private" | "group";
  targetId: string;
}

export default function ChatWindow({ type, targetId }: Props) {
  const { user } = useAuth();
  const { closeChat } = useChat();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [displayName, setDisplayName] = useState("");
  
  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  };

  // Load initial messages
  useEffect(() => {
    const fetchInitialMessages = async () => {
      try {
        const res = await axios.get(`/api/chat/${type}/${targetId}`, {
          withCredentials: true,
        });
        const data = res.data || [];
        setMessages(data);
        setDisplayName(data?.nickname);
        scrollToBottom();
      } catch (err: unknown) {
        const errorObj = err as { message?: string };
        console.error("Failed to load messages", errorObj.message || err);
      }
    };
    
    fetchInitialMessages();
  }, [type, targetId]);

  // WebSocket message handler
  useEffect(() => {
    const handle = (msg: WSMessage) => {
      if (msg.channel !== "chat") return;
      
      // Cast the data to appropriate type
      const chatData = msg.data as Record<string, unknown>;
      
      if (msg.event === "typing") {
        // Store typing info and set timeout to clear it
        const isTyping = (chatData.content as string) === "typing";
        setIsTyping(isTyping);
        setTypingUser(((chatData.nickname as string) || (chatData.sender_id as string)) || "");
        if (isTyping) {
          setTimeout(() => {
            setIsTyping(false);
            setTypingUser("");
          }, 2000);
        }  
        return;
      }

      const senderId = (chatData.sender_id as string) || "";
      
      // Construct a proper Message object
      const normalized: Message = {
        id: (chatData.id as string) || "",
        sender_id: senderId,
        recipient_id: chatData.recipient_id as string | undefined,
        group_id: chatData.group_id as string | undefined,
        content: (chatData.content as string) || "",
        is_emoji_only: (chatData.is_emoji_only as boolean) || false,
        created_at: chatData.created_at as string | undefined,
        channel: msg.channel,
        event: msg.event,
        data: chatData
      };

      const isRelevant =
        (msg.event === "private_message" &&
          type === "private" &&
          (senderId === targetId || senderId === user?.id)) ||
        (msg.event === "group_message" &&
          type === "group" &&
          (chatData.group_id as string) === targetId);

      if (!isRelevant) return;

      setMessages((prev) => {
        const exists = prev.some(
          (m) =>
            m.content === normalized.content &&
            m.created_at === normalized.created_at &&
            m.sender_id === normalized.sender_id
        );
        return exists ? prev : [...prev, normalized];
      });
      scrollToBottom();
    };

    onChannel("chat", handle);
    return () => offChannel("chat", handle);
  }, [type, targetId, user?.id]);

  return (
    <div className="bg-white w-80 h-[500px] rounded-2xl shadow-lg flex flex-col overflow-hidden border border-gray-200">
      <ChatHeader
        type={type}
        targetId={targetId}
        onClose={() => closeChat(type, targetId)}
      />
      <ChatMessages
        messages={messages}
        isTyping={isTyping}
        scrollRef={scrollRef}
        type={type}
        displayName={displayName}
        typingName={typingUser}
      />
      <div className="border-t border-gray-100 p-2 bg-white">
        <MessageComposer type={type} targetId={targetId} />
      </div>
    </div>
  );
}
