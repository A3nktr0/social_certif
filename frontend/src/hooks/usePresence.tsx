import { useEffect, useState } from "react";
import { connectWebSocket, offChannel, onChannel } from "@/lib/services/ws";
import axios from "axios";

interface PresenceUpdate {
  channel: string;
  event: string;
  data: {
    user_id: string;
    nickname: string;
    online: boolean;
  };
}

export function usePresence(currentUserId?: string | null) {
  const [onlineStatus, setOnlineStatus] = useState<Record<string, boolean>>({});
  const [triggerUpdate, setTriggerUpdate] = useState(0);
  const [mutualIds, setMutualIds] = useState<string[]>([]);

  useEffect(() => {
    if (!currentUserId) return;

    connectWebSocket();

    // Step 2: Listen to presence_update
    const handle = (msg: PresenceUpdate) => {
      if (msg.channel !== "presence") return;

      const { user_id, nickname, online } = msg.data;
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
