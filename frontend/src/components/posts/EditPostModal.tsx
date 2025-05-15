"use client";

import { useState } from "react";
import { Post } from "@/types/post";
import api from "@/lib/services/axios";
import DOMPurify from "dompurify";

export default function EditPostModal({
  post,
  onClose,
  onSaved,
}: {
  post: Post;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [content, setContent] = useState(post.content);
  const [imageUrl, setImageUrl] = useState(post.image || "");
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    const clean = DOMPurify.sanitize(content.trim(), {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    });

    if (!clean) {
      setError("Content cannot be empty.");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("content", clean);
      formData.append("image_url", imageUrl); // May be "" to delete

      if (newImageFile) {
        formData.append("image", newImageFile);
      }

      await api.put(`/posts/${post.id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      onSaved();
    } catch {
      setError("Failed to update post.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl p-6 sm:p-8 shadow-xl space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800 text-center">Edit Post</h2>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          placeholder="Update your post..."
          className="w-full rounded-xl border border-gray-300 p-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-800"
        />

        {/* Image Preview */}
        {imageUrl && (
          <div className="relative">
            <img
              src={imageUrl}
              alt="Post"
              className="w-full max-h-60 object-cover rounded-lg"
            />
            <button
              onClick={() => {
                setImageUrl("");
                setNewImageFile(null);
              }}
              className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded"
            >
              Remove Image
            </button>
          </div>
        )}

        {/* New Image Upload */}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setNewImageFile(file);
              setImageUrl(""); // Clear old image when new is chosen
            }
          }}
          className="block mt-2 text-gray-900 border border-gray-300 rounded-lg text-sm p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="text-sm text-gray-600 hover:text-gray-900 px-4 py-1.5"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !content.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-1.5 rounded-xl transition disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
