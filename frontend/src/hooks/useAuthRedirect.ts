"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

// This hook is used to redirect users to a specified path if they are not authenticated.
export function useAuthRedirect(redirectPath: string = "/login") {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(redirectPath);
    }
  }, [loading, user, router, redirectPath]);

  return { loading };
}
