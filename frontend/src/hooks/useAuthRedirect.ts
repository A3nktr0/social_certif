"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

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
