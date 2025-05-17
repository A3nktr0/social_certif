"use client";

import { useState } from "react";
import DOMPurify from "dompurify";
import api from "@/lib/services/axios";
import { Event } from "@/types/event";

interface Props {
  groupId: string | string[];
  event: Event;
  onClose: () => void;
  onUpdate: () => void;
}

export default function EditEventModal({
  groupId,
  event,
  onClose,
  onUpdate,
}: Props) {
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description);
  const [eventTime, setEventTime] = useState(
    new Date(event.event_time).toISOString().slice(0, 16)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sanitize = (input: string) =>
    DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanTitle = sanitize(title.trim());
    const cleanDescription = sanitize(description.trim());

    if (!cleanTitle || !cleanDescription || !eventTime) {
      setError("All fields are required.");
      return;
    }

    if (cleanTitle.length > 100) {
      setError("Title must be under 100 characters.");
      return;
    }

    const parsedDate = new Date(eventTime);
    if (isNaN(parsedDate.getTime()) || parsedDate < new Date()) {
      setError("Event time must be in the future.");
      return;
    }

    setLoading(true);
    try {
      await api.patch(`/groups/${groupId}/events/${event.id}`, {
        title: cleanTitle,
        description: cleanDescription,
        event_time: parsedDate.toISOString(),
      });

      onUpdate();
      onClose();
    } catch {
        setError("Failed to update event.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-6 space-y-5">
        <h2 className="text-center text-lg font-semibold text-gray-900">Edit Event</h2>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Event title"
            maxLength={100}
            className="w-full text-gray-900 bg-gray-100 px-4 py-2 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Event description"
            maxLength={1000}
            rows={3}
            className="w-full text-gray-900 bg-gray-100 px-4 py-2 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="datetime-local"
            value={eventTime}
            onChange={(e) => setEventTime(e.target.value)}
            className="w-full text-gray-900 bg-gray-100 px-4 py-2 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            min={new Date().toISOString().slice(0, 16)}
          />

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-gray-500 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-5 py-2 rounded-full disabled:opacity-60 transition"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
