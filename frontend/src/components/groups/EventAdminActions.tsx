"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/services/axios";
import ConfirmModal from "@/components/common/ConfirmModal";
import { Event } from "@/types/event";

interface Props {
  groupId: string | string[];
  eventId: string | string[];
  event: Event;
  onEdit?: () => void; // just triggers parent to open modal
}

export default function EventAdminActions({
  groupId,
  eventId,
  event,
  onEdit,
}: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/groups/${groupId}/events/${eventId}`);
      router.replace(`/groups/${groupId}?tab=events`);
    } catch {
      alert("Failed to delete event");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="flex justify-end gap-2 pt-4 border-t">
        <button
          onClick={onEdit}
          className="bg-yellow-400 hover:bg-yellow-500 text-white text-sm px-4 py-2 rounded"
        >
          Edit
        </button>
        <button
          onClick={() => setShowConfirm(true)}
          disabled={deleting}
          className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded"
        >
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>

      {showConfirm && (
        <ConfirmModal
          title="Delete Event"
          message={`Are you sure you want to delete "${event.title}"?`}
          onCancel={() => setShowConfirm(false)}
          onConfirm={handleDelete}
        />
      )}
    </>
  );
}
