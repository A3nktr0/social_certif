"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/context/AuthContext";

// Define chat types
export type ChatType = "private" | "group";

// Represents an open chat window (either private or group)
export interface OpenChat {
  type: ChatType;
  id: string; // userId or groupId
}

// Context value interface
export interface ChatContextType {
  openChats: OpenChat[];
  openChat: (type: ChatType, id: string) => void;
  closeChat: (type: ChatType, id: string) => void;
  clearAllChats: () => void;
}

// Create context
const ChatContext = createContext<ChatContextType | null>(null);

// Provider component
export function ChatManagerProvider({ children }: { children: ReactNode }) {
  const [openChats, setOpenChats] = useState<OpenChat[]>([]);
  const { user } = useAuth();

  // Opens a new chat window, replacing any existing
  const openChat = useCallback((type: ChatType, id: string) => {
    setOpenChats([{ type, id }]);
  }, []);

  // Closes a specific chat window, memoized
  const closeChat = useCallback((type: ChatType, id: string) => {
    setOpenChats((prev) =>
      prev.filter((c) => !(c.type === type && c.id === id))
    );
  }, []);

  // Clears all chat windows, memoized
  const clearAllChats = useCallback(() => {
    setOpenChats([]);
  }, []);

  // Memoize context value to prevent provider re-renders
  const value = useMemo(
    () => ({ openChats, openChat, closeChat, clearAllChats }),
    [openChats, openChat, closeChat, clearAllChats],
  );

  useEffect(() => {
    // Clear all chats if user is not logged in
    if (!user) {
      setOpenChats([]);
    }
  }, [user]);

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

// Hook to consume chat context
export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error("useChatContext must be used within <ChatManagerProvider>");
  }
  return ctx;
}
