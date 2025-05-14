// components/modals/DeleteProfileModal.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/services/axios";
import { useAuth } from "@/context/AuthContext";

interface DeleteProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DeleteProfileModal({ isOpen, onClose }: DeleteProfileModalProps) {
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const { setUser } = useAuth();

  if (!isOpen) return null;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete("/me");
      setUser(null);
      router.push("/login");
    } catch (err) {
      alert("Failed to delete profile.");
    } finally {
      setDeleting(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Delete Profile</h3>
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to delete your profile? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
