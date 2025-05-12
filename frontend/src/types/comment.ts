export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  image?: string;
  created_at: string;
  user: {
    id: string;
    nickname: string;
    avatar: string;
  };
}
