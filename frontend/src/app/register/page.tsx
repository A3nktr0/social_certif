"use client";

import { useRouter } from "next/navigation";
import api from "@/lib/services/axios";
import RegisterForm from "@/components/auth/RegisterForm";
import Link from "next/link";
import { useGuestRedirect } from "@/hooks/useGuestRedirect";

export default function RegisterPage() {
  const router = useRouter();

  useGuestRedirect();

  const handleRegister = async (form: FormData) => {
    try {
      await api.post("/register", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      router.push("/login");
    } catch (err: any) {
      const message =
        err?.response?.data || err?.message || "Registration failed";
      throw new Error(message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-6 p-8 bg-white border border-gray-200 rounded-xl shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-1">MySocial</h1>
          <p className="text-sm text-gray-500">Create your account</p>
        </div>

        <RegisterForm
          title=""
          onSubmit={handleRegister}
          fields={[
            { name: "email", type: "email", label: "Email", required: true },
            { name: "password", type: "password", label: "Password", required: true },
            { name: "first_name", type: "text", label: "First Name", required: true },
            { name: "last_name", type: "text", label: "Last Name", required: true },
            { name: "dob", type: "date", label: "Date of Birth", required: true },
            { name: "nickname", type: "text", label: "Nickname", required: true },
            { name: "is_private", type: "radio", label: "Profile Privacy (Public or Private)", required: true },
            { name: "about", type: "text", label: "About Me (optional)", required: false },
            { name: "avatar", type: "file", label: "Avatar URL (optional)", required: false },
          ]}
        />

        <div className="text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-blue-600 hover:underline font-medium"
          >
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
