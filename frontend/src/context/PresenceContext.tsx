// "use client";

// import { createContext, useContext, ReactNode, useEffect, useState, useRef } from "react";
// import { connectWebSocket, onChannel, offChannel } from "@/lib/services/ws";
// import axios from "axios";

// // shape of a mutual chat user
// export interface ChatUser {
//   id: string;
//   nickname: string;
// }

// // incoming presence message
// interface PresenceUpdate {
//   channel: string;
//   event: string;
//   data: {
//     user_id: string;
//     nickname: string;
//     online: boolean;
//   };
// }

// interface PresenceContextValue {
//   onlineStatus: Record<string, boolean>;
//   mutualUsers: ChatUser[];
// }

// const PresenceContext = createContext<PresenceContextValue | null>(null);

// export function PresenceProvider({ children }: { children: ReactNode }) {
//   const [onlineStatus, setOnlineStatus] = useState<Record<string, boolean>>({});
//   const [mutualUsers, setMutualUsers] = useState<ChatUser[]>([]);
//   const initialized = useRef(false);

//   useEffect(() => {
//     if (initialized.current) return;
//     initialized.current = true;

//     // 1. establish WS
//     connectWebSocket();

//     // 2. fetch your mutuals once
//     axios
//       .get<ChatUser[]>("/api/chat/mutuals", { withCredentials: true })
//       .then((res) => {
//         const users = res.data || [];
//         setMutualUsers(users);

//         // init everyone as offline until messages arrive
//         const initStatus: Record<string, boolean> = {};
//         users.forEach((u) => (initStatus[u.id] = false));
//         setOnlineStatus(initStatus);
//       })
//       .catch(() => {
//         setMutualUsers([]);
//         setOnlineStatus({});
//       });

//     // 3. subscribe to presence updates
//     const handle = (msg: PresenceUpdate) => {
//       if (msg.channel !== "presence") return;
//       const { user_id, online } = msg.data;
//       setOnlineStatus((prev) => ({ ...prev, [user_id]: online }));
//     };
//     onChannel("presence", handle);
//     return () => void offChannel("presence", handle);
//   }, []);

//   return (
//     <PresenceContext.Provider value={{ onlineStatus, mutualUsers }}>
//       {children}
//     </PresenceContext.Provider>
//   );
// }

// // hook for consumers
// export function usePresence() {
//   const ctx = useContext(PresenceContext);
//   if (!ctx) {
//     throw new Error("usePresence must be used inside <PresenceProvider>");
//   }
//   return ctx;
// }
