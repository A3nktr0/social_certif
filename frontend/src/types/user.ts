export type BaseUser = {
  id: string;
  first_name: string;
  last_name: string;
  avatar: string;
  nickname: string;
};

export type FollowerUser = BaseUser & {
  is_following: boolean;
};

export type ChatUser = BaseUser & {
  is_online: boolean;
  is_typing: boolean;
};
