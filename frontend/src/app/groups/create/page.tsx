"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/services/axios";
import DOMPurify from "dompurify";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";

export default function CreateGroupPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);
  
  // Check authentication
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setSubmitting(true);

    const safeName = DOMPurify.sanitize(name.trim(), { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
    const safeDesc = DOMPurify.sanitize(description.trim(), { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });

    if (!safeName) {
      setError("Group name is required.");
      setSubmitting(false);
      return;
    }

    if (avatar && (!avatar.type.startsWith("image/") || avatar.size > 2 * 1024 * 1024)) {
      setError("Avatar must be an image and under 2MB.");
      setSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", safeName);
      formData.append("description", safeDesc);
      if (avatar) formData.append("avatar", avatar);

      await api.post("/groups", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      router.push("/groups");
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: string } };
      setError(errorObj?.response?.data || "Failed to create group.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-2xl shadow-lg space-y-6">
        <h1 className="text-2xl font-semibold text-gray-800">Create a New Group</h1>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Group Name"
            required
            className="w-full rounded-xl border border-gray-300 p-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
          />

          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Group Description"
            className="w-full rounded-xl border border-gray-300 p-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-800"
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Group Avatar</label>
            <div className="relative w-full border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-blue-400 transition">
              <label
                htmlFor="avatar-upload"
                className="cursor-pointer text-blue-600 font-medium hover:underline"
              >
                Click to upload
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={(e) => setAvatar(e.target.files?.[0] || null)}
                className="hidden"
              />

              {avatar && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 truncate">
                    Selected: <span className="font-medium">{avatar.name}</span>
                  </p>
                  <div className="relative h-64 w-full max-w-md mx-auto">
                    <Image
                      src={URL.createObjectURL(avatar)}
                      alt="Image preview"
                      fill
                      className="rounded-lg border object-contain"
                      sizes="(max-width: 768px) 100vw, 400px"
                      unoptimized={true}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-xl transition disabled:opacity-50"
          >
            {isSubmitting ? "Creating..." : "Create Group"}
          </button>
        </form>
      </div>
    </main>
  );
}
