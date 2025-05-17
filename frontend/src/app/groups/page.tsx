"use client";

import { useEffect, useState } from "react";
import api from "@/lib/services/axios";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import Image from "next/image";
import { Group } from "@/types/group";

export default function GroupsPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await api.get("/groups");
        setGroups(Array.isArray(res.data) ? res.data : []);
      } catch (err: unknown) {
        if (
          err &&
          typeof err === "object" &&
          "response" in err &&
          err.response &&
          typeof (err as { response: unknown }).response === "object" &&
          "data" in (err as { response: { data?: unknown } }).response
        ) {
          const response = (err as { response: { data?: unknown } }).response;
          setError(
            typeof response.data === "string"
              ? response.data
              : "Failed to load groups."
          );
        } else {
          setError("Failed to load groups.");
        }
      }
    };
    if (user) fetchGroups();
  }, [user]);

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">Your Groups</h1>
          <div className="flex gap-2">
            <Link
              href="/groups/discover"
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-full text-sm font-medium shadow transition"
            >
              Discover Groups
            </Link>
            <Link
              href="/groups/create"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-medium shadow transition"
            >
              + Create Group
            </Link>
          </div>
        </div>

        {error && <p className="text-center text-red-500">{error}</p>}

        {groups.length === 0
          ? (
            <p className="text-center text-gray-500">
              You&apos;re not in any groups yet.
            </p>
          )
          : (
            <ul className="space-y-4">
              {groups.map((group) => (
                <li
                  key={group.id}
                  className="bg-white p-4 rounded-xl border shadow-sm hover:shadow-md transition"
                >
                  <Link
                    href={`/groups/${group.id}`}
                    className="flex items-center gap-4"
                  >
                    <Image
                      src={group.avatar || "/static/avatars/default.jpg"}
                      alt="group avatar"
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover border"
                      priority
                      unoptimized={true}
                      onError={(e) => {
                        // Fallback to default image if there's an error loading the user avatar
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = "/static/avatars/default.jpg";
                      }}
                    />
                    <div>
                      <p className="text-lg font-medium text-gray-800">
                        {group.name}
                      </p>
                      <p className="text-sm text-gray-500 line-clamp-2">
                        {group.description}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
      </div>
    </main>
  );
}
