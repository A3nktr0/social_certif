"use client";

import { useState } from "react";
import { Event } from "@/types/event";
import api from "@/lib/services/axios";
import Link from "next/link";

interface Props {
  event: Event;
  groupId: string;
}

export default function GroupEventCard({ event, groupId }: Props) {
  const [rsvp, setRsvp] = useState<"going" | "not_going" | null>(event.user_response ?? null);
  const [loading, setLoading] = useState(false);

  const respond = async (response: "going" | "not_going") => {
    if (loading) return;
    setLoading(true);
    try {
      await api.post(`/groups/${groupId}/events/${event.id}/rsvp`, { response });
      setRsvp(response);
    } catch (err) {
      console.error("RSVP failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-white space-y-2 shadow-sm hover:shadow-md transition">
      <Link href={`/groups/${groupId}/events/${event.id}`}>
        <h3 className="text-lg font-semibold text-gray-900 hover:underline">
          {event.title}
        </h3>
      </Link>
      <p className="text-sm text-gray-600">{event.description}</p>
      <p className="text-xs text-gray-400">
        🗓 {new Date(event.event_time).toLocaleString()}
      </p>

      <div className="flex gap-3 mt-2">
        <button
          onClick={() => respond("going")}
          disabled={loading}
          className={`px-4 py-1 rounded-full text-sm font-medium border transition ${
            rsvp === "going"
              ? "bg-green-600 text-white"
              : "bg-gray-100 hover:bg-green-100 text-gray-800"
          }`}
        >
          Going
        </button>
        <button
          onClick={() => respond("not_going")}
          disabled={loading}
          className={`px-4 py-1 rounded-full text-sm font-medium border transition ${
            rsvp === "not_going"
              ? "bg-red-600 text-white"
              : "bg-gray-100 hover:bg-red-100 text-gray-800"
          }`}
        >
          Not Going
        </button>
      </div>
    </div>
  );
}
