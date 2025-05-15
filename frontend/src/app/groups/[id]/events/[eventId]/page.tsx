"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/services/axios";
import { Event } from "@/types/event";
import EventRSVPList from "@/components/groups/EventRSVPList";
import EventHeader from "@/components/groups/EventHeader";
import EventAdminActions from "@/components/groups/EventAdminActions";
import { RSVP } from "@/types/event";
import EditEventModal from "@/components/groups/EditEventModal";
import { useAuth } from "@/context/AuthContext";

export default function EventDetailPage() {
  const { id: groupId, eventId } = useParams() as {
    id: string;
    eventId: string;
  };
  const router = useRouter();

  const [event, setEvent] = useState<Event | null>(null);
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const { user, loading } = useAuth();

  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  const fetchEvent = async () => {
    try {
      const res = await api.get(`/groups/${groupId}/events/${eventId}`);
      setEvent(res.data.event);
      setRsvps(res.data.rsvps || []);
      setAccessDenied(false);
    } catch (err: any) {
      if (err?.response?.status === 403 || err?.response?.status === 404) {
        setAccessDenied(true);
      } else {
        router.replace(`/groups/${groupId}`);
      }
    }
  };

  useEffect(() => {
    if (user && !loading) {
      fetchEvent();
    }
  }, [groupId, eventId, user, loading]);

  const refreshEvent = async () => {
    await fetchEvent();
    router.replace(`/groups/${groupId}/events/${eventId}`);
  };

  if (loading) {
    return (
      <p className="text-center py-10 text-gray-500 text-sm">
        Loading event...
      </p>
    );
  }

  if (accessDenied) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white max-w-sm w-full p-6 rounded-xl shadow text-center space-y-4 border">
          <div className="text-4xl">🔒</div>
          <h2 className="text-lg font-semibold text-gray-800">Access Denied</h2>
          <p className="text-sm text-gray-600">
            You don’t have permission to view this event. Only group admins or the creator can access event details.
          </p>
          <button
            onClick={() => router.back()}
            className="mt-2 inline-block px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 transition"
          >
            ← Go Back
          </button>
        </div>
      </main>
    );
  }

  if (!event) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-xl mx-auto bg-white shadow rounded-xl p-6 space-y-6">
        <EventHeader event={event} />
        <EventRSVPList rsvps={rsvps} />
        {groupId && eventId && (
          <EventAdminActions
            event={event}
            groupId={groupId}
            eventId={eventId}
            onEdit={() => setShowEditModal(true)}
          />
        )}
      </div>
      {showEditModal && (
        <EditEventModal
          groupId={groupId}
          event={event}
          onClose={() => setShowEditModal(false)}
          onUpdate={refreshEvent}
        />
      )}
    </main>
  );
}
