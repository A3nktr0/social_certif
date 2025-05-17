"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/services/axios";
import { Post } from "@/types/post";
import PostCard from "@/components/posts/PostCard";
import CommentForm from "@/components/comments/CommentForm";
import CommentList from "@/components/comments/CommentList";

export default function PostDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    api.get(`/posts/${id}`)
      .then((res) => setPost(res.data))
      .catch((err) => {
        if (err.response?.status === 403) {
          setError("You are not allowed to view this post.");
        } else if (err.response?.status === 404) {
          setError("Post not found.");
        } else {
          setError("Failed to load post.");
        }
      });
  }, [id]);

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {error && <p className="text-center text-red-500">{error}</p>}
        {post && (
          <>
            <PostCard post={post} />
            <CommentForm
              postId={post.id}
              onCommentAdded={() => window.location.reload()}
            />
            <CommentList postId={post.id} />
          </>
        )}
      </div>
    </main>
  );
}
