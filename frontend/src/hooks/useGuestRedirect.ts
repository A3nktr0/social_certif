"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

// This hook is used to redirect authenticated users to a specified path if they are already logged in.
export function useGuestRedirect(target: string = "/dashboard") {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace(target);
    }
  }, [user, loading, router, target]);
}
