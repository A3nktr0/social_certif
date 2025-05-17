"use client";

import { useState } from "react";
import api from "@/lib/services/axios";
import DOMPurify from "dompurify";

interface Props {
  groupId: string;
  onEventCreated: () => void;
}

export default function GroupEventForm({ groupId, onEventCreated }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sanitize = (input: string) =>
    DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedTitle = sanitize(title.trim());
    const trimmedDescription = sanitize(description.trim());

    if (!trimmedTitle || !trimmedDescription || !eventTime) {
      setError("All fields are required.");
      return;
    }

    if (trimmedTitle.length > 100) {
      setError("Title is too long (max 100 characters).");
      return;
    }

    if (trimmedDescription.length > 1000) {
      setError("Description is too long (max 1000 characters).");
      return;
    }

    const eventDate = new Date(eventTime);
    if (isNaN(eventDate.getTime()) || eventDate < new Date()) {
      setError("Please select a valid future date/time.");
      return;
    }

    setLoading(true);
    try {
      await api.post(`/groups/${groupId}/events`, {
        title: trimmedTitle,
        description: trimmedDescription,
        event_time: eventDate.toISOString(),
      });

      setTitle("");
      setDescription("");
      setEventTime("");
      onEventCreated();
    } catch {
      console.log("Failed to create event.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      <input
        type="text"
        placeholder="Event title"
        value={title}
        maxLength={100}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full text-gray-800 border bg-gray-100 px-4 py-2 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <textarea
        placeholder="Event description"
        value={description}
        maxLength={1000}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full text-gray-800 border bg-gray-100 px-4 py-2 text-sm rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows={3}
      />

      <input
        type="datetime-local"
        value={eventTime}
        onChange={(e) => setEventTime(e.target.value)}
        className="w-full text-gray-800 border bg-gray-100 px-4 py-2 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        min={new Date().toISOString().slice(0, 16)}
      />

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-6 py-2 rounded-full disabled:opacity-50 transition"
        >
          {loading ? "Creating..." : "Create Event"}
        </button>
      </div>
    </form>
  );
}
