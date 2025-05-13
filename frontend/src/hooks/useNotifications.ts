import { useEffect, useState } from "react";
import { connectWebSocket, offChannel, onChannel } from "@/lib/services/ws";
import axios from "axios";

export function useNotifications(userId?: string | null) {
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread count initially
  useEffect(() => {
    if (!userId) return;

    // fetch("/api/notifications/unread/count", { credentials: "include" })
    //   .then((res) => res.json())
    //   .then((data) => setUnreadCount(data.count || 0))
    //   .catch(() => setUnreadCount(0));

    axios.get("/api/notifications/unread/count", {
      withCredentials: true,
    })
      .then((res) => {
        const data = res.data;
        setUnreadCount(data.count || 0);
      })
      .catch(() => {
        setUnreadCount(0);
      });
  }, [userId]);

  // WebSocket listener
  useEffect(() => {
    if (!userId) return;

    connectWebSocket();

    const handle = (msg: any) => {
      if (msg.channel !== "notifications") return;

      // Only increment if message is meant to be unread
      if (!msg.is_read) {
        setUnreadCount((prev) => prev + 1);
      }
    };

    onChannel("notifications", handle);
    return () => offChannel("notifications", handle);
  }, [userId]);

  // Expose control functions
  return {
    unreadCount,
    decrement: () => setUnreadCount((c) => Math.max(c - 1, 0)),
    reset: () => setUnreadCount(0),
    set: setUnreadCount,
  };
}
