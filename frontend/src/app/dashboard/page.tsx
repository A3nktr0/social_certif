"use client";

import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const { loading: redirectLoading } = useAuthRedirect();

  // Show loading state if either auth context or redirect is loading
  if (loading || redirectLoading) return <LoadingSpinner />;
  if (!user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white border border-gray-200 shadow-md rounded-xl p-6 max-w-md w-full space-y-4 text-center">
        <div className="relative w-20 h-20 mx-auto">
          <Image
            src={user.avatar || "/static/avatars/default.jpg"}
            alt="User Avatar"
            className="rounded-full border object-cover"
            fill
            sizes="80px"
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
        <h1 className="text-2xl font-semibold text-gray-800">
          Welcome, {user.first_name}!
        </h1>
        <p className="text-sm text-gray-600">You&apos;re now logged in 🎉</p>
      </div>
    </div>
  );
}
