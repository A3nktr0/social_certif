"use client";

import { useState } from "react";
import api from "@/lib/services/axios";
import Image from "next/image";

interface Props {
  group: {
    id: string;
    name: string;
    description: string;
    avatar?: string;
  };
  onClose: () => void;
  onUpdated: () => void;
}

export default function EditGroupModal({ group, onClose, onUpdated }: Props) {
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description);
  const [imageUrl, setImageUrl] = useState(group.avatar || "");
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpdate = async () => {
    if (!name.trim()) {
      setError("Group name cannot be empty.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("description", description.trim());

      if (imageUrl === "" && !newImageFile) {
        formData.append("delete_avatar", "true");
      }

      if (newImageFile) {
        formData.append("avatar", newImageFile);
      }

      await api.put(`/groups/${group.id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      onUpdated();
      onClose();
    } catch {
      setError("Failed to update group.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 sm:p-8 shadow-xl space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800 text-center">
          Edit Group
        </h2>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Group name"
          className="w-full border text-gray-900 border-gray-300 rounded-xl px-4 py-2 text-sm shadow-sm focus:ring-2 focus:ring-blue-500"
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Group description"
          rows={3}
          className="w-full border text-gray-900 border-gray-300 rounded-xl px-4 py-2 text-sm shadow-sm resize-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Current Avatar Preview */}
        {imageUrl && (
          <div className="relative">
            <Image
              src={imageUrl}
              alt="Current Avatar"
              width={100}
              height={100}
              unoptimized
              className="rounded-md border object-cover"
            />
            <button
              onClick={() => {
                setImageUrl("");
                setNewImageFile(null);
              }}
              className="absolute top-0 right-0 bg-red-500 text-white text-xs px-2 py-1 rounded"
            >
              Remove Image
            </button>
          </div>
        )}

        {/* New Avatar Upload */}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setNewImageFile(file);
              setImageUrl(""); // Clear current preview
            }
          }}
          className="block w-full border text-gray-900 border-gray-300 text-sm rounded-lg p-2 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:bg-blue-600 file:text-white hover:file:bg-blue-700"
        />

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="text-sm text-gray-600 hover:text-gray-900 px-4 py-1.5"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-1.5 rounded-xl transition disabled:opacity-40"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
