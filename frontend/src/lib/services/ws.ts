// lib/services/ws.ts

interface WSMessage {
  channel: string;
  event: string;
  data: unknown;
}

type WSCallback = (payload: WSMessage) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private listeners: Record<string, Set<WSCallback>> = {};
  private reconnectDelay = 5000;
  private url = process.env.NEXT_PUBLIC_WS_URL || "wss://localhost:8080/api/ws"; // configurable

  connect() {
    if (this.socket && this.socket.readyState <= 1) return;

    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
      console.info("[WS] Connected");
    };

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WSMessage;
        const channel = message?.channel;
        if (channel && this.listeners[channel]) {
          this.listeners[channel].forEach((cb) => cb(message));
        }
      } catch (err) {
        console.error("[WS] Invalid message:", err);
      }
    };

    this.socket.onclose = () => {
      console.warn("[WS] Disconnected. Reconnecting...");
      setTimeout(() => this.connect(), this.reconnectDelay);
    };

    this.socket.onerror = (err) => {
      console.error("[WS] Error:", err);
      this.socket?.close();
    };
  }

  send(payload: unknown) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(payload));
    } else {
      console.warn("[WS] Send failed — socket not open");
      // Attempt to connect and queue the message for when connection is established
      this.connect();
    }
  }

  on(channel: string, callback: WSCallback) {
    if (!this.listeners[channel]) {
      this.listeners[channel] = new Set();
    }
    this.listeners[channel].add(callback);
  }

  off(channel: string, callback: WSCallback) {
    if (this.listeners[channel]) {
      this.listeners[channel].delete(callback);
    }
  }
}

const WS = new WebSocketService();
export default WS;

// Hooks API (optional re-export for convenience)
export const connectWebSocket = () => WS.connect();
export const onChannel = (ch: string, cb: WSCallback) => WS.on(ch, cb);
export const offChannel = (ch: string, cb: WSCallback) => WS.off(ch, cb);
export const socketSend = (msg: unknown) => WS.send(msg);

// Add exports to prevent TypeScript unused variable warnings
export type { WSMessage, WSCallback };
