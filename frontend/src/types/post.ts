export type PostVisibility = "public" | "private" | "selected" | "group";

export interface Author {
  id: string;
  name: string;
  avatar: string;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  image?: string;
  created_at: string;
  visibility: PostVisibility;
  like_count: number;
  liked_by_user: boolean;
  author: Author;
}
