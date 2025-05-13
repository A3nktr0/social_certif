"use client";

import { useChat } from "@/hooks/useChat";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Message } from "@/types/message";
import { offChannel, onChannel } from "@/lib/services/ws";
import MessageComposer from "./MessageComposer";
import ChatHeader from "@components/chat/ChatHeader";
import ChatMessages from "@components/chat/ChatMessages";
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

//   // Load initial messages
//   useEffect(() => {
//     axios
//       .get(`/api/chat/${type}/${targetId}`, { withCredentials: true })
//       .then((res) => {
//         setMessages(res.data || []);
//         setDisplayName(res.data?.nickname);
//         scrollToBottom();
//       })
//       .catch((err) => console.error("Failed to load messages", err));
//   }, [type, targetId]);


    const fetchInitialMessages = async () => {
      try {
        const res = await axios.get(`/api/chat/${type}/${targetId}`, {
          withCredentials: true,
        });
        const data = res.data || [];
        setMessages(data);
        setDisplayName(data?.nickname);
        scrollToBottom();
      } catch (err) {
        console.error("Failed to load messages", err);
      }
    };
  useEffect(() => {
    fetchInitialMessages();
  }, [type, targetId]);

  // WebSocket message handler
  useEffect(() => {
    const handle = (msg: Message) => {
      if (msg.channel !== "chat") return;

      if (msg.event === "typing") {
        const typingTarget = msg.data?.group_id || msg.sender_id;
        const isRelevantTyping =
          (type === "private" && typingTarget === targetId) ||
          (type === "group" && msg.data?.group_id === targetId);

        if (isRelevantTyping) {
          setIsTyping(msg.content === "typing");
          if (msg.data?.nickname) {
            setTypingUser(msg.data.nickname);
          }
        }
        return;
      }

      const senderId = msg.data?.sender_id || msg.sender_id;
      const normalized: Message = { ...msg, sender_id: senderId };

      const isRelevant =
        (normalized.event === "private_message" &&
          type === "private" &&
          (senderId === targetId || senderId === user?.id)) ||
        (normalized.event === "group_message" &&
          type === "group" &&
          normalized.data?.group_id === targetId);

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

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  };

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
