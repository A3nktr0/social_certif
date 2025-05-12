type WSCallback = (payload: any) => void;

const listeners: Record<string, WSCallback[]> = {};
let socket: WebSocket | null = null;

export function connectWebSocket() {
  if (socket && socket.readyState <= 1) return;

  socket = new WebSocket("wss://localhost:8080/api/ws"); // replace with env in prod

  socket.onopen = () => {
    console.log("[WS] Connected");
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (!data.channel) return;

      if (listeners[data.channel]) {
        listeners[data.channel].forEach((cb) => cb(data));
      }
    } catch (e) {
      console.error("[WS] Failed to parse message:", e);
    }
  };

  socket.onclose = () => {
    console.warn("[WS] Disconnected, retrying in 5s...");
    setTimeout(connectWebSocket, 5000);
  };

  socket.onerror = (err) => {
    console.error("[WS] Error:", err);
    socket?.close();
  };
}

// Register listener
export function onChannel(channel: string, callback: WSCallback) {
  if (!listeners[channel]) listeners[channel] = [];
  listeners[channel].push(callback);
}

// Unregister listener
export function offChannel(channel: string, callback: WSCallback) {
  if (!listeners[channel]) return;
  listeners[channel] = listeners[channel].filter((cb) => cb !== callback);
}
