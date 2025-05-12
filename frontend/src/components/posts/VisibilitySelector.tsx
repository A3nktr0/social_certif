"use client";

import React from "react";

interface Props {
  visibility: "public" | "private" | "selected";
  setVisibility: (v: "public" | "private" | "selected") => void;
}

export default function VisibilitySelector({ visibility, setVisibility }: Props) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Post Visibility
      </label>
      <select
        value={visibility}
        onChange={(e) => setVisibility(e.target.value as any)}
        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="public">🌍 Public</option>
        <option value="private">👥 Followers Only</option>
        <option value="selected">🔒 Selected Followers</option>
      </select>
    </div>
  );
}
