export type Group = {
    id: string;
    name: string;
    description: string;
    avatar?: string;
    creator_id: string;
    created_at: string;
    is_member: boolean;
    is_admin: boolean;
  };