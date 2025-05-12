"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) return <p className="text-center text-gray-500">Loading...</p>;
  if (!user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white border border-gray-200 shadow-md rounded-xl p-6 max-w-md w-full space-y-4 text-center">
        <img
          src={user.avatar || "/static/avatars/default.jpg"}
          alt="User Avatar"
          className="mx-auto w-20 h-20 rounded-full border object-cover"
        />
        <h1 className="text-2xl font-semibold text-gray-800">
          Welcome, {user.first_name}!
        </h1>
        <p className="text-sm text-gray-600">You’re now logged in 🎉</p>
      </div>
    </div>
  );
}
