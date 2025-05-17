"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export function useGuestRedirect(target: string = "/dashboard") {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace(target);
    }
  }, [user, loading, router, target]);
}
