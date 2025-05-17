"use client";

import { useState } from "react";
import Link from "next/link";
import { FaHeart, FaRegHeart } from "react-icons/fa6";
import { Post } from "@/types/post";
import api from "@/lib/services/axios";
import { useAuth } from "@/context/AuthContext";
import EditPostModal from "@/components/posts/EditPostModal";
import ConfirmModal from "../common/ConfirmModal";
import Image from "next/image";

export default function PostCard({ post }: { post: Post }) {
  const { user } = useAuth();
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [liked, setLiked] = useState(post.liked_by_user);
  const [loading, setLoading] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const isOwner = user?.id === post.user_id;

  const toggleLike = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const url = liked ? `/posts/${post.id}/unlike` : `/posts/${post.id}/like`;
      await api.post(url);
      setLikeCount((prev) => prev + (liked ? -1 : 1));
      setLiked(!liked);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      alert(errorObj?.message || "Failed to update like.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-xl bg-white shadow-sm space-y-3 p-4 relative">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/profile/${post.author.id}`} className="relative w-10 h-10">
          <Image
            src={post.author.avatar || "/static/avatars/default.jpg"}
            alt={`${post.author.name}'s avatar`}
            className="rounded-full object-cover border"
            fill
            sizes="40px"
            unoptimized={true}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = "/static/avatars/default.jpg";
            }}
          />
        </Link>
        <div>
          <Link
            href={`/profile/${post.author.id}`}
            className="font-semibold text-gray-900 hover:underline text-sm"
          >
            @{post.author.name}
          </Link>
          <p className="text-xs text-gray-400">
            {new Date(post.created_at).toLocaleString('fr')}
          </p>
        </div>
      </div>

      {/* Content */}
      {post.content && (
        <p className="text-gray-800 text-sm whitespace-pre-line break-words">
          {post.content}
        </p>
      )}

      {post.image && (
        <div className="relative w-full h-[450px]">
          <Image
            src={post.image}
            alt="Post content"
            className="rounded-md border object-contain"
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            unoptimized={true}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = "/static/images/error-placeholder.jpg";
            }}
          />
        </div>
      )}

      {/* Meta */}
      <div className="flex justify-between text-sm text-gray-500 pt-1">
        <span>
          {post.visibility === "public"
            ? "🔓 Public"
            : post.visibility === "group"
            ? "👥 Group"
            : "🔒 Private"}
        </span>
        <Link
          href={`/post/${post.id}`}
          className="text-blue-500 hover:underline"
        >
          View Post
        </Link>
      </div>

      {/* Actions */}
      <div className="flex gap-4 items-center mt-2">
        <button
          aria-label={liked ? "Unlike post" : "Like post"}
          onClick={toggleLike}
          disabled={loading}
          className={`text-sm font-medium flex items-center gap-1 ${
            liked ? "text-red-500" : "text-gray-500"
          }`}
        >
          {liked ? <FaHeart /> : <FaRegHeart />}
          <span>{likeCount}</span>
        </button>
        <Link
          href={`/post/${post.id}`}
          className="text-sm text-blue-600 hover:underline"
        >
          Comments
        </Link>
      </div>

      {/* Owner Controls */}
      {isOwner && (
        <div className="flex justify-end gap-3 mt-2 text-sm">
          <button
            onClick={() => setShowEdit(true)}
            className="text-blue-600 hover:underline"
          >
            Edit
          </button>
          <button
            onClick={() => setShowDelete(true)}
            className="text-red-600 hover:underline"
          >
            Delete
          </button>
        </div>
      )}

      {showEdit && (
        <EditPostModal
          post={post}
          onClose={() => setShowEdit(false)}
          onSaved={() => window.location.reload()}
        />
      )}

      {showDelete && (
        <ConfirmModal
          title="Delete Post"
          message="Are you sure you want to delete this post?"
          onCancel={() => setShowDelete(false)}
          onConfirm={async () => {
            try {
              await api.delete(`/posts/${post.id}`);
              window.location.href = "/feed";
            } catch (err: unknown) {
              const errorObj = err as { message?: string };
              alert(errorObj?.message || "Failed to delete post.");
            }
          }}
        />
      )}
    </div>
  );
}
