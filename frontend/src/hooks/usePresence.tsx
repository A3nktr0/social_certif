import { useEffect, useState } from "react";
import { connectWebSocket, offChannel, onChannel, WSMessage } from "@/lib/services/ws";

export function usePresence(currentUserId?: string | null) {
  const [onlineStatus, setOnlineStatus] = useState<Record<string, boolean>>({});
  const [triggerUpdate, setTriggerUpdate] = useState(0);
  const [mutualIds] = useState<string[]>([]);

  useEffect(() => {
    if (!currentUserId) return;

    connectWebSocket();

    // Step 2: Listen to presence_update
    const handle = (msg: WSMessage) => {
      if (msg.channel !== "presence") return;

      // Type-safe handling of the websocket data
      const data = msg.data as { user_id: string; nickname: string; online: boolean };
      const { user_id, online } = data;
      if (!user_id) return;

      setOnlineStatus((prev) => ({
        ...prev,
        [user_id]: online,
      }));

      setTriggerUpdate((prev) => prev + 1);
    };

    onChannel("presence", handle);
    return () => offChannel("presence", handle);
  }, [currentUserId]);

  return { onlineStatus, triggerUpdate, mutualIds };
}
