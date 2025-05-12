"use client";

import { useState } from "react";
import api from "@/lib/services/axios";
import DOMPurify from "dompurify";
import { Image as ImageIcon, X } from "lucide-react";

interface Props {
  groupId: string;
  onPostCreated: () => void;
}

export default function GroupPostForm({ groupId, onPostCreated }: Props) {
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  const MAX_FILE_SIZE_MB = 5;
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanContent = DOMPurify.sanitize(content.trim(), {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    });

    if (!cleanContent && !image) {
      setError("Please enter text or upload an image.");
      return;
    }

    if (image) {
      if (!ALLOWED_TYPES.includes(image.type)) {
        setError("Only JPG, PNG, or GIF files are allowed.");
        return;
      }

      if (image.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setError(`Image must be under ${MAX_FILE_SIZE_MB}MB.`);
        return;
      }
    }

    try {
      setIsPosting(true);
      const formData = new FormData();
      formData.append("content", cleanContent);
      if (image) formData.append("image", image);

      await api.post(`/groups/${groupId}/posts`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      setContent("");
      setImage(null);
      onPostCreated();
    } catch (err: any) {
      setError(err?.response?.data || "Failed to post.");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 mt-4 border rounded-xl p-4 bg-white shadow"
    >
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <textarea
        rows={3}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a post for this group..."
        className="w-full border rounded-lg px-4 py-2 text-sm bg-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
      />

      {/* Image input with preview */}
      <div className="flex items-center justify-between">
        <label className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline cursor-pointer">
          <ImageIcon className="w-5 h-5" />
          <span>Add Image</span>
          <input
            type="file"
            accept="image/png, image/jpeg, image/gif"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
            className="hidden"
          />
        </label>

        <button
          type="submit"
          disabled={isPosting}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 text-sm rounded-full transition disabled:opacity-40"
        >
          {isPosting ? "Posting..." : "Post"}
        </button>
      </div>

      {image && (
        <div className="relative w-fit mt-2">
          <img
            src={URL.createObjectURL(image)}
            alt="Preview"
            className="rounded-md border max-h-64 object-contain"
          />
          <button
            type="button"
            onClick={() => setImage(null)}
            className="absolute top-1 right-1 bg-white bg-opacity-75 rounded-full p-1 text-gray-700 hover:text-red-500"
            title="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </form>
  );
}
