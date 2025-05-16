"use client";

import { useEffect, useState } from "react";
import api from "@/lib/services/axios";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Group } from "@/types/group";

export default function DiscoverGroupsPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDiscoverableGroups = async () => {
      try {
        const res = await api.get("/groups/discover");
        setGroups(Array.isArray(res.data) ? res.data : []);
      } catch (err: any) {
        setError(err?.response?.data || "Failed to load groups.");
      }
    };
    if (user) fetchDiscoverableGroups();
  }, [user]);

  const handleJoin = async (groupId: string) => {
    try {
      await api.post(`/groups/${groupId}/join`);
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
    } catch (err: any) {
      alert(err?.response?.data || "Failed to request to join group.");
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-blue-600 text-center">Discover Groups</h1>

        {error && <p className="text-center text-red-500">{error}</p>}

        {groups.length === 0 ? (
          <p className="text-center text-gray-500">No joinable groups found.</p>
        ) : (
          <ul className="space-y-4">
            {groups.map((group) => (
              <li
                key={group.id}
                className="flex items-center justify-between bg-white p-4 rounded-xl border shadow-sm hover:shadow-md transition"
              >
                <Link href={`/groups/${group.id}`} className="flex items-center gap-4">
                  <img
                    src={group.avatar || "/static/avatars/default.jpg"}
                    alt="group avatar"
                    className="w-12 h-12 rounded-full object-cover border hover:scale-105 transition-transform"
                  />
                  <div>
                    <p className="text-gray-800 font-medium">{group.name}</p>
                    <p className="text-sm text-gray-500 line-clamp-2">{group.description}</p>
                  </div>
                </Link>

                <button
                  onClick={() => handleJoin(group.id)}
                  className="px-5 py-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white text-sm shadow transition cursor-pointer"
                >
                  Request to Join Group
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
