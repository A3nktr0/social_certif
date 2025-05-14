"use client";

import { useEffect, useState } from "react";
import { Comment } from "@/types/comment";
import api from "@/lib/services/axios";
import DOMPurify from "dompurify";
import { useAuth } from "@/context/AuthContext";
import ConfirmModal from "@/components/common/ConfirmModal";

export default function CommentList({ postId }: { postId: string }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState("");

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const fetchComments = () => {
    api
      .get(`/posts/${postId}/comments`)
      .then((res) => setComments(Array.isArray(res.data) ? res.data : []))
      .catch(() => setError("Failed to load comments."));
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const handleUpdate = async (commentId: string) => {
    try {
      await api.put(`/comments/${commentId}`, {
        content: DOMPurify.sanitize(editedContent.trim()),
      });
      setEditingId(null);
      fetchComments();
    } catch {
      alert("Failed to update comment.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await api.delete(`/comments/${deleteTargetId}`);
      setDeleteTargetId(null);
      fetchComments();
    } catch {
      alert("Failed to delete comment.");
    }
  };

  return (
    <div className="mt-6 space-y-4">
      <h3 className="font-semibold text-gray-800 text-sm">Comments</h3>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {comments.length === 0 ? (
        <p className="text-sm text-gray-500">No comments yet.</p>
      ) : (
        comments.map((c) => (
          <div key={c.id} className="flex items-start gap-3 relative">
            <img
              src={c.user.avatar}
              alt="avatar"
              className="w-9 h-9 rounded-full object-cover border"
            />
            <div className="bg-gray-100 px-4 py-2 rounded-xl max-w-full w-full">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-gray-900">
                  @{DOMPurify.sanitize(c.user.nickname || "Unknown")}
                </p>

                {user?.id === c.user.id && (
                  <div className="flex gap-2 text-xs text-gray-500">
                    <button
                      onClick={() => {
                        setEditingId(c.id);
                        setEditedContent(c.content);
                      }}
                      className="hover:underline text-blue-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteTargetId(c.id)}
                      className="hover:underline text-red-500"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {editingId === c.id ? (
                <>
                  <textarea
                    className="w-full mt-2 text-sm border rounded p-2 text-gray-900"
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    rows={3}
                  />
                  <div className="flex justify-end gap-2 mt-2 text-sm">
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleUpdate(c.id)}
                      className="bg-blue-600 text-white px-3 py-1 rounded"
                    >
                      Save
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p
                    className="text-sm text-gray-800 whitespace-pre-line mt-1"
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
                </>
              )}
            </div>
          </div>
        ))
      )}

      {deleteTargetId && (
        <ConfirmModal
          title="Delete Comment"
          message="Are you sure you want to delete this comment? This cannot be undone."
          onCancel={() => setDeleteTargetId(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
