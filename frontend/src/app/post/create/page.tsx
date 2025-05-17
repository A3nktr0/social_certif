"use client";

import { useEffect, useState } from "react";
import api from "@/lib/services/axios";
import { useRouter } from "next/navigation";
import VisibilitySelector from "@/components/posts/VisibilitySelector";
import SelectedFollowers from "@/components/posts/SelectedFollowers";
import DOMPurify from "dompurify";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { BaseUser } from "@/types/user";

interface Follower {
  id: string;
  name: string;
  avatar: string;
}

export default function CreatePostPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [visibility, setVisibility] = useState<
    "public" | "private" | "selected"
  >("public");
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [targetUsers, setTargetUsers] = useState<string[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check authentication
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (visibility === "selected") {
      api.get("/follow/followers")
        .then((res) => {
          const users = res.data.map((u: BaseUser) => ({
            id: u.id,
            name: u.nickname || `${u.first_name} ${u.last_name}`,
            avatar: u.avatar || "/static/avatars/default.jpg",
          }));
          setFollowers(users);
        })
        .catch(() => setFollowers([]));
    }
  }, [visibility]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const safeContent = DOMPurify.sanitize(content.trim(), {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    });

    if (!safeContent) {
      setError("Post content is required.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("content", safeContent);
      formData.append("visibility", visibility);
      if (image) formData.append("image", image);
      if (visibility === "selected") {
        targetUsers.forEach((id) => formData.append("target_users[]", id));
      }

      await api.post("/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      router.push("/feed");
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: string } };
      setError(errorObj?.response?.data || "Failed to create post.");
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-2xl shadow-lg space-y-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          Create New Post
        </h1>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <textarea
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full rounded-xl border border-gray-300 p-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-800"
          />

          <VisibilitySelector
            visibility={visibility}
            setVisibility={setVisibility}
          />

          {visibility === "selected" && (
            <SelectedFollowers
              followers={followers}
              selected={targetUsers}
              onChange={setTargetUsers}
            />
          )}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Attach an Image or GIF
            </label>

            <div className="relative w-full border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-blue-400 transition">
              <label
                htmlFor="file-upload"
                className="cursor-pointer text-blue-600 font-medium hover:underline"
              >
                Click to select an image
              </label>
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
                className="hidden"
              />

              {image && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-gray-600 truncate">
                    Selected: <span className="font-medium">{image.name}</span>
                  </p>
                  <div className="relative h-64 w-full max-w-md mx-auto">
                    <Image
                      src={URL.createObjectURL(image)}
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
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-xl transition"
          >
            Post
          </button>
        </form>
      </div>
    </main>
  );
}
