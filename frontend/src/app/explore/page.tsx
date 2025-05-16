"use client";

import { useEffect, useState } from "react";
import api from "@/lib/services/axios";
import Link from "next/link";

type User = {
  id: string;
  first_name: string;
  last_name: string;
  avatar: string;
  nickname: string;
};

export default function ExplorePage() {
  const [people, setPeople] = useState<User[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchExplore = async () => {
      try {
        const res = await api.get("/explore");
        setPeople(Array.isArray(res.data) ? res.data : []);
      } catch (err: any) {
        setError(err?.response?.data || "Failed to load users.");
      }
    };
    fetchExplore();
  }, []);

  const handleFollow = async (id: string) => {
    try {
      await api.post(`/follow/${id}`);
      setPeople((prev) => prev.filter((u) => u.id !== id));
    } catch {
      alert("Failed to follow user.");
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-center text-blue-600">
          Explore People
        </h1>

        {error && <p className="text-center text-red-500">{error}</p>}

        {people.length === 0
          ? <p className="text-center text-gray-500">No suggestions found.</p>
          : (
            <ul className="space-y-4">
              {people.map((person) => (
                <li
                  key={person.id}
                  className="flex items-center justify-between bg-white p-4 rounded-xl border shadow-sm hover:shadow-md transition"
                >
                  <Link
                    href={`/profile/${person.id}`}
                    className="flex items-center gap-4"
                  >
                    <img
                      src={person.avatar}
                      alt="avatar"
                      className="w-12 h-12 rounded-full object-cover border hover:scale-105 transition-transform"
                    />
                    <div>
                      <p className="text-gray-800 font-medium">
                        {person.first_name} {person.last_name}
                      </p>
                      {person.nickname && (
                        <p className="text-sm text-blue-500">
                          @{person.nickname}
                        </p>
                      )}
                    </div>
                  </Link>
                  <button
                    onClick={() => handleFollow(person.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-1.5 rounded-md transition"
                  >
                    Follow
                  </button>
                </li>
              ))}
            </ul>
          )}
      </div>
    </main>
  );
}
