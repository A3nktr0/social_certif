export interface Event {
  id: string;
  title: string;
  description: string;
  event_time: string;
  created_at: string;
  creator_nickname: string
  user_response?: "going" | "not_going" | null;
}

export interface RSVP {
  user_id: string;
  nickname: string;
  avatar: string;
  response: "going" | "not_going";
}
