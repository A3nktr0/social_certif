"use client";

import { useGuestRedirect } from "@/hooks/useGuestRedirect";
import Link from "next/link";

export default function HomePage() {
  useGuestRedirect();
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white border border-gray-200 shadow-md rounded-xl p-8 max-w-lg w-full text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-800">Welcome to MySocial</h1>
        <p className="text-gray-600 text-sm">
          A full-stack social network platform with real-time chat, groups, and more.
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <Link
            href="/login"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="px-6 py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 text-sm rounded-lg transition"
          >
            Register
          </Link>
        </div>
      </div>
    </main>
  );
}
