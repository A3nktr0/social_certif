
"use client";
import { useRef } from "react";

export default function AvatarSection({
  avatarUrl,
  isOwnProfile,
  onChange,
}: {
  avatarUrl: string;
  isOwnProfile: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative inline-block">
      <img
        src={`${avatarUrl}?t=${Date.now()}`}
        alt="avatar"
        className="w-24 h-24 mx-auto rounded-full border object-cover cursor-pointer hover:opacity-80 transition"
        onClick={() => isOwnProfile && fileRef.current?.click()}
      />
      {isOwnProfile && (
        <input
          type="file"
          hidden
          ref={fileRef}
          accept="image/*"
          onChange={onChange}
        />
      )}
    </div>
  );
}
