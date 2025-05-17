"use client";

import AuthForm from "@/components/auth/AuthForm";
import { postJSON } from "@/lib/services/api";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/services/axios";
import Link from "next/link";
import { useGuestRedirect } from "@/hooks/useGuestRedirect";

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuth();

  useGuestRedirect();

  const waitForAuth = async (tries = 5) => {
    for (let i = 0; i < tries; i++) {
      try {
        const res = await api.get("/me");
        return res.data;
      } catch {
        await new Promise((res) => setTimeout(res, 100));
      }
    }
    throw new Error("Failed to fetch user after login");
  };

  const handleLogin = async (form: Record<string, string>) => {
    await postJSON("/login", form);
    const user = await waitForAuth();
    setUser(user);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-6 p-8 bg-white border border-gray-200 rounded-xl shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-1">MySocial</h1>
          <p className="text-sm text-gray-500">Login to your account</p>
        </div>

        <AuthForm
          title=""
          onSubmit={handleLogin}
          fields={[
            { name: "email", type: "email", label: "Email" },
            { name: "password", type: "password", label: "Password" },
          ]}
        />

        <div className="text-center text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="text-blue-600 hover:underline font-medium"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
