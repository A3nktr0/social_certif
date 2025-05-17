"use client";

import Link from "next/link";
import Image from "next/image";

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
        <div className="relative w-8 h-8">
          <Image
            src={avatar || "/static/avatars/default.jpg"}
            alt={`${nickname || first_name}'s avatar`}
            className="rounded-full border object-cover"
            fill
            sizes="32px"
            unoptimized={true}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = "/static/avatars/default.jpg";
            }}
          />
        </div>
        <div>
          <p className="font-medium text-sm text-gray-800">{first_name} {last_name}</p>
          {nickname && <p className="text-xs text-blue-500">@{nickname}</p>}
        </div>
      </Link>
      {action && <div>{action}</div>}
    </li>
  );
}
