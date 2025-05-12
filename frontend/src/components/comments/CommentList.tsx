"use client";

import { useEffect, useState } from "react";
import { Comment } from "@/types/comment";
import api from "@/lib/services/axios";
import DOMPurify from "dompurify";

export default function CommentList({ postId }: { postId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/posts/${postId}/comments`)
      .then((res) => setComments(Array.isArray(res.data) ? res.data : []))
      .catch(() => setError("Failed to load comments."));
  }, [postId]);

  return (
    <div className="mt-6 space-y-4">
      <h3 className="font-semibold text-gray-800 text-sm">Comments</h3>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {comments.length === 0 ? (
        <p className="text-sm text-gray-500">No comments yet.</p>
      ) : (
        comments.map((c) => (
          <div key={c.id} className="flex items-start gap-3">
            <img
              src={c.user.avatar}
              alt="avatar"
              className="w-9 h-9 rounded-full object-cover border"
            />
            <div className="bg-gray-100 px-4 py-2 rounded-xl max-w-full">
              <p className="text-sm font-medium text-gray-900">
                @{DOMPurify.sanitize(c.user.nickname || "Unknown")}
              </p>
              <p
                className="text-sm text-gray-800 whitespace-pre-line"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(c.content),
                }}
              />
              {c.image && (
                <img
                  src={c.image}
                  alt="comment image"
                  className="mt-2 rounded-md border max-h-64 object-contain"
                />
              )}
              <p className="text-xs text-gray-400 mt-1">
                {new Date(c.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
