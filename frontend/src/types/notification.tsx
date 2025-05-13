export interface Notification {
  id: string;
  type: string;
  fromUserId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  nickname: string;
  data: Record<string, any>;
}
