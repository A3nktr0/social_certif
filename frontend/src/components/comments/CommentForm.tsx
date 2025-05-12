"use client";

import { useState } from "react";
import api from "@/lib/services/axios";
import DOMPurify from "dompurify";
import { Image as ImageIcon, X } from "lucide-react";

export default function CommentForm({
  postId,
  onCommentAdded,
}: {
  postId: string;
  onCommentAdded?: () => void;
}) {
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const safeContent = DOMPurify.sanitize(content.trim());
    if (!safeContent && !image) {
      setError("Comment must include text or an image.");
      return;
    }

    const formData = new FormData();
    formData.append("content", safeContent);
    if (image) formData.append("image", image);

    try {
      await api.post(`/posts/${postId}/comments`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setContent("");
      setImage(null);
      setError("");
      onCommentAdded?.();
    } catch {
      setError("Failed to submit comment.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t pt-4 mt-6 space-y-3 text-gray-800"
    >
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a comment..."
        rows={2}
        className="w-full border rounded-lg px-4 py-2 text-sm bg-gray-100 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
      />

      <div className="flex items-center justify-between">
        {/* Custom file input */}
        <div className="relative">
          <label className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded cursor-pointer hover:bg-blue-200 transition">
            <ImageIcon className="w-4 h-4" />
            <span>Add image</span>
            <input
              type="file"
              accept="image/png, image/jpeg, image/gif"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
              className="hidden"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={!content.trim() && !image}
          className="bg-blue-600 text-white px-4 py-1.5 text-sm rounded hover:bg-blue-700 disabled:opacity-30"
        >
          Post
        </button>
      </div>

      {/* Image preview */}
      {image && (
        <div className="relative w-fit">
          <img
            src={URL.createObjectURL(image)}
            alt="preview"
            className="mt-2 max-h-40 rounded-md border object-contain"
          />
          <button
            type="button"
            onClick={() => setImage(null)}
            className="absolute top-1 right-1 bg-white bg-opacity-70 rounded-full p-1 text-gray-700 hover:text-red-500"
            title="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </form>
  );
}
