"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/services/axios";
import { Post } from "@/types/post";
import PostCard from "@/components/posts/PostCard";

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const res = await api.get("/posts/feed");
        setPosts(Array.isArray(res.data) ? res.data : []);
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'response' in err && 
            err.response && typeof err.response === 'object' && 'data' in err.response) {
          setError(String(err.response.data));
        } else {
          setError("Failed to load users.");
        }
      }
    };
    fetchFeed();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">Your Feed</h1>
          <Link
            href="/post/create"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-medium shadow transition"
          >
            + Create Post
          </Link>
        </div>

        {error && <p className="text-center text-red-500">{error}</p>}

        {posts.length === 0 ? (
          <p className="text-center text-gray-500">No posts yet.</p>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </main>
  );
}
