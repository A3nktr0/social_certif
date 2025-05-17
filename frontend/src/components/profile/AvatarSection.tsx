
"use client";
import { useRef } from "react";
import Image from "next/image";

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
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-24 h-24 mx-auto">
          <Image
            src={`${avatarUrl || "/static/avatars/default.jpg"}?t=${Date.now()}`}
            alt="Profile avatar"
            className="rounded-full border object-cover"
            fill
            sizes="96px"
            priority
            unoptimized={true}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = "/static/avatars/default.jpg";
            }}
          />
        </div>
        
        {isOwnProfile && (
          <button
            onClick={() => fileRef.current?.click()}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-1.5 rounded-full transition shadow-sm"
            type="button"
          >
            Update Avatar
          </button>
        )}
      </div>
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
