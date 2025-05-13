export interface Message {
    id?: string;
    sender_id: string;
    recipient_id?: string;
    group_id?: string;
    content: string;
    is_emoji_only: boolean;
    created_at?: string;
    channel: string;
    event: string;
    data?: Record<string, any>;
  }
  
export interface ChatOutboundMessage {
  channel: "chat";
  event: "private_message" | "group_message";
  to: string;
  content: string;
  data?: Record<string, any>;
}

