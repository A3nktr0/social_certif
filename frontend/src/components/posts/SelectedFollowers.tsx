"use client";

import React from "react";
import Image from "next/image";

interface Follower {
  id: string;
  name: string;
  avatar: string;
}

interface Props {
  followers: Follower[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export default function SelectedFollowers({ followers, selected, onChange }: Props) {
  const toggle = (id: string, checked: boolean) => {
    onChange(
      checked ? [...selected, id] : selected.filter((uid) => uid !== id)
    );
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700">Select Followers</p>
      {followers.length === 0 ? (
        <p className="text-xs text-gray-400">No followers available.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {followers.map((f) => (
            <label
              key={f.id}
              className="flex items-center gap-3 bg-gray-50 border border-gray-200 p-2 rounded-lg shadow-sm hover:bg-gray-100 transition"
            >
              <input
                type="checkbox"
                value={f.id}
                checked={selected.includes(f.id)}
                onChange={(e) => toggle(f.id, e.target.checked)}
                className="accent-blue-600"
              />
              <div className="relative w-8 h-8">
                <Image
                  src={f.avatar || "/static/avatars/default.jpg"}
                  alt={`${f.name}'s avatar`}
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
              <span className="text-sm text-gray-800">{f.name}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
