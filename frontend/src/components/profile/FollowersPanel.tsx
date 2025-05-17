"use client";

import { useEffect, useState } from "react";
import api from "@/lib/services/axios";
import UserListItem from "@/components/profile/UserListItem";
import { FollowerUser } from "@/types/user";

type Props = {
  refreshStats: () => void;
};

export default function FollowersPanel({ refreshStats }: Props) {
  const [followers, setFollowers] = useState<FollowerUser[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/follow/followers");
        setFollowers(res.data);
        refreshStats();
      } catch (err: unknown) {
        const errorObj = err as { response?: { data?: string } };
        setError(errorObj?.response?.data || "Failed to load data");
      }
    };
    fetchData();
  }, [refreshStats]);

  const handleFollowBack = async (id: string) => {
    try {
      await api.post(`/follow/${id}`);
      refreshStats();
      setFollowers((prev) =>
        prev?.map((u) => (u.id === id ? { ...u, is_following: true } : u)) || []
      );
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: string } };
      alert(errorObj?.response?.data || "Failed to follow back.");
    }
  };

  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="space-y-6 mt-6">
      {/* Followers */}
      <div>
        <h2 className="text-lg font-semibold mb-2 text-gray-800">Followers</h2>
        {followers?.length
          ? (
            <ul className="divide-y border rounded-md">
              {followers.map((u) => (
                <UserListItem
                  key={u.id}
                  {...u}
                  action={!u.is_following && (
                    <button
                      onClick={() => handleFollowBack(u.id)}
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                    >
                      Follow back
                    </button>
                  )}
                />
              ))}
            </ul>
          )
          : <p className="text-sm text-gray-500">You have no followers.</p>}
      </div>
    </div>
  );
}
