"use client";

import LoadingSpinner from "@/components/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";

export default function NotFoundPage() {
  const { user, loading } = useAuth();
  const { loading: redirectLoading } = useAuthRedirect();

  // Show loading state if either auth context or redirect is loading
  if (loading || redirectLoading) return <LoadingSpinner />;
  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-white">
      <div className="text-center max-w-md">
        <LoadingSpinner isFullScreen={false} size="md" />
      </div>
    </div>
  );
}
