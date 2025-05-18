"use client";

import { useEffect, useState } from "react";
import api from "@/lib/services/axios";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import LoadingSpinner from "@/components/LoadingSpinner";

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
  const { user, loading } = useAuth();
  const { loading: redirectLoading } = useAuthRedirect();

  
  useEffect(() => {
    const fetchExplore = async () => {
      try {
        const res = await api.get("/explore");
        setPeople(Array.isArray(res.data) ? res.data : []);
      } catch (err: unknown) {
        if (
          err && typeof err === "object" && "response" in err &&
          err.response && typeof err.response === "object" &&
          "data" in err.response
        ) {
          setError(String(err.response.data));
        } else {
          setError("Failed to load users.");
        }
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
  // Show loading state if either auth context or redirect is loading
  if (loading || redirectLoading) return <LoadingSpinner />;
  if (!user) return null;
  
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
                    <div className="relative w-12 h-12">
                      <Image
                        src={person.avatar || "/static/avatars/default.jpg"}
                        alt={`${person.first_name}'s avatar`}
                        className="rounded-full object-cover border hover:scale-105 transition-transform"
                        fill
                        sizes="48px"
                        priority
                        unoptimized={true}
                        onError={(e) => {
                          // Fallback to default image if there's an error loading the user avatar
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = "/static/avatars/default.jpg";
                        }}
                      />
                    </div>
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
