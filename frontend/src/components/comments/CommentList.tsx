"use client";

import { useEffect, useState, useCallback } from "react";
import { Comment } from "@/types/comment";
import api from "@/lib/services/axios";
import DOMPurify from "dompurify";
import { useAuth } from "@/context/AuthContext";
import ConfirmModal from "@/components/common/ConfirmModal";
import Image from "next/image";

export default function CommentList({ postId }: { postId: string }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [editedImageFile, setEditedImageFile] = useState<File | null>(null);
  const [editedImageUrl, setEditedImageUrl] = useState<string>("");

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const fetchComments = useCallback(() => {
    api
      .get(`/posts/${postId}/comments`)
      .then((res) => setComments(Array.isArray(res.data) ? res.data : []))
      .catch((err: unknown) => {
        const errorObj = err as { response?: { data?: string } };
        setError(errorObj?.response?.data || "Failed to load comments.");
      });
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleUpdate = async (commentId: string) => {
    const formData = new FormData();
    formData.append("content", DOMPurify.sanitize(editedContent.trim()));
    formData.append("image_url", editedImageUrl ?? "");

    if (editedImageFile) {
      formData.append("image", editedImageFile);
    }

    try {
      await api.put(`/comments/${commentId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setEditingId(null);
      setEditedImageFile(null);
      setEditedImageUrl("");
      fetchComments();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: string } };
      alert(errorObj?.response?.data || "Failed to update comment.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await api.delete(`/comments/${deleteTargetId}`);
      setDeleteTargetId(null);
      fetchComments();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: string } };
      alert(errorObj?.response?.data || "Failed to delete comment.");
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
            <div className="relative w-9 h-9">
              <Image
                src={c.user.avatar || "/static/avatars/default.jpg"}
                alt={`${c.user.nickname || "User"}'s avatar`}
                className="rounded-full object-cover border"
                fill
                sizes="36px"
                unoptimized={true}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = "/static/avatars/default.jpg";
                }}
              />
            </div>
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
                        setEditedImageUrl(c.image ?? "");
                        setEditedImageFile(null);
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

                  {editedImageUrl && !editedImageFile && (
                    <div className="relative mt-2">
                      <div className="relative h-48 w-full max-w-md">
                        <Image
                          src={editedImageUrl}
                          alt="Comment image"
                          className="rounded border object-contain"
                          fill
                          sizes="(max-width: 768px) 100vw, 400px"
                          unoptimized={true}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            // Don't set a fallback as we want to know if there's an issue
                          }}
                        />
                      </div>
                      <button
                        onClick={() => setEditedImageUrl("")}
                        className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-0.5 rounded"
                      >
                        Remove Image
                      </button>
                    </div>
                  )}

                  {editedImageFile && (
                    <p className="text-xs mt-1 text-gray-600">
                      Selected: {editedImageFile.name}
                    </p>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setEditedImageFile(file);
                        setEditedImageUrl("");
                      }
                    }}
                    className="block mt-2 text-gray-900 border border-gray-300 rounded-lg text-sm p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <div className="flex justify-end gap-2 mt-2 text-sm">
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditedImageFile(null);
                        setEditedImageUrl("");
                      }}
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
                    <div className="relative mt-2 h-64 w-full max-w-md">
                      <Image
                        src={c.image}
                        alt="Comment image"
                        className="rounded-md border object-contain"
                        fill
                        sizes="(max-width: 768px) 100vw, 400px"
                        unoptimized={true}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = "/static/comments/default.jpg";
                        }}
                      />
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(c.created_at).toLocaleString('fr')}
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
