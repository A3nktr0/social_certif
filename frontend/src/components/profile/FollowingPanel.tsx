"use client";

import { useEffect, useState } from "react";
import api from "@/lib/services/axios";
import UserListItem from "@/components/profile/UserListItem";
import { BaseUser } from "@/types/user";

type Props = {
  refreshStats: () => void;
};

export default function FollowingPanel({ refreshStats }: Props) {
  const [following, setFollowing] = useState<BaseUser[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/follow/following")
      .then(res => setFollowing(res.data))
      .catch(err => setError(err?.response?.data || "Failed to load following list"));
  }, []);

  const handleUnfollow = async (id: string) => {
    try {
      await api.post(`/follow/unfollow/${id}`);
      refreshStats();
      setFollowing(prev => prev?.filter(u => u.id !== id) || []);
    } catch {
      alert("Failed to unfollow user.");
    }
  };

  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-2">Following</h2>
      {following?.length
        ? (
          <ul className="divide-y border rounded-md">
            {following.map(u => (
              <UserListItem
                key={u.id}
                {...u}
                action={
                  <button
                    onClick={() => handleUnfollow(u.id)}
                    className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded"
                  >
                    Unfollow
                  </button>
                }
              />
            ))}
          </ul>
        )
        : <p className="text-sm text-gray-500">You are not following anyone.</p>
      }
    </div>
  );
}
