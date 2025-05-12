"use client";

import { Post } from "@/types/post";
import Link from "next/link";
import { useState } from "react";
import api from "@/lib/services/axios";
import { FaHeart, FaRegHeart } from "react-icons/fa6";

export default function PostCard({ post }: { post: Post }) {
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [liked, setLiked] = useState(post.liked_by_user);
  const [loading, setLoading] = useState(false);

  const toggleLike = async () => {
    if (loading) return; // prevent spamming
    setLoading(true);
    try {
      if (liked) {
        await api.post(`/posts/${post.id}/unlike`);
        setLikeCount((prev) => prev - 1);
        setLiked(false);
      } else {
        await api.post(`/posts/${post.id}/like`);
        setLikeCount((prev) => prev + 1);
        setLiked(true);
      }
    } catch (err: any) {
      alert("Failed to update like.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-xl p-4 bg-white shadow-sm space-y-3">
      <div className="flex items-center gap-3">
        <Link href={`/profile/${post.author.id}`}>
          <img
            src={post.author.avatar}
            alt="avatar"
            className="w-9 h-9 rounded-full object-cover border"
          />
        </Link>
        <div>
          <Link
            href={`/profile/${post.author.id}`}
            className="hover:underline text-gray-800 font-medium"
          >
            @{post.author.name}
          </Link>
          <p className="text-xs text-gray-400">
            {new Date(post.created_at).toLocaleString()}
          </p>
        </div>
      </div>

      <p className="text-gray-700 text-sm whitespace-pre-line">
        {post.content}
      </p>

      {post.image && (
        <img
          src={post.image}
          alt="post"
          className="rounded-md border max-h-[400px] object-cover"
        />
      )}

      <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
        <>
        </>
        <span>
          {post.visibility === "public"
            ? "🔓 "
            : post.visibility === "group"
            ? "👥 "
            : "🔒 "}

          {post.visibility.charAt(0).toUpperCase() + post.visibility.slice(1)}
        </span>
        <Link
          href={`/post/${post.id}`}
          className="text-blue-500 hover:underline"
        >
          View post
        </Link>
      </div>

      <div className="flex gap-4 items-center mt-2">
        <button
          onClick={toggleLike}
          disabled={loading}
          className={`text-sm font-medium flex items-center gap-1 cursor-pointer ${
            liked ? "text-red-500" : "text-gray-500"
          }`}
        >
          {liked
            ? <FaHeart className="inline-block text-red-500" />
            : <FaRegHeart className="inline-block text-gray-500" />}
          <span>{likeCount}</span>
        </button>
        <Link
          href={`/post/${post.id}`}
          className="text-sm text-blue-600 hover:underline"
        >
          Comments
        </Link>
      </div>
    </div>
  );
}
