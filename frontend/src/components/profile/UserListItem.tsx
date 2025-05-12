"use client";

import Link from "next/link";

type Props = {
  id: string;
  avatar: string;
  first_name: string;
  last_name: string;
  nickname?: string;
  action?: React.ReactNode;
};

export default function UserListItem({ id, avatar, first_name, last_name, nickname, action }: Props) {
  return (
    <li className="flex items-center justify-between p-3 hover:bg-gray-50">
      <Link href={`/profile/${id}`} className="flex items-center gap-3 hover:opacity-90">
        <img src={avatar} alt="avatar" className="w-8 h-8 rounded-full border object-cover" />
        <div>
          <p className="font-medium text-sm text-gray-800">{first_name} {last_name}</p>
          {nickname && <p className="text-xs text-blue-500">@{nickname}</p>}
        </div>
      </Link>
      {action && <div>{action}</div>}
    </li>
  );
}
