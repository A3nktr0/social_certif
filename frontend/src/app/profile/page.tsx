"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function ProfileRedirectPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { loading: redirectLoading } = useAuthRedirect();

  useEffect(() => {
    // Set a timeout to handle potential issues with redirection
    const timeout = setTimeout(() => {
      if (!loading && !user && !isRedirecting) {
        setError("You need to be signed in to access your profile");
      }
    }, 3000);

    if (!loading) {
      if (user) {
        try {
          setIsRedirecting(true);
          router.replace(`/profile/${user.id}`);
        } catch (err) {
          setError("Failed to redirect to your profile");
          console.error("Redirect error:", err);
        }
      } else {
        // User is not authenticated, redirect to login
        setIsRedirecting(true);
        router.push("/login");
      }
    }

    return () => clearTimeout(timeout);
  }, [user, loading, router, isRedirecting]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-md">
          <h1 className="text-xl font-semibold text-red-700 mb-2">Error</h1>
          <p className="text-red-600 mb-4">{error}</p>
          <Link
            href="/login"
            className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
          >
            Go to login page
          </Link>
        </div>
      </div>
    );
  }

  // Show loading state if either auth context or redirect is loading
  if (loading || redirectLoading) return <LoadingSpinner />;
  if (!user) return null;

  // Show loading or redirecting state
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-white">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-4">
        </div>
        <p className="text-gray-600">
          {loading
            ? "Loading your profile..."
            : "Redirecting to your profile..."}
        </p>
      </div>
    </div>
  );
}
