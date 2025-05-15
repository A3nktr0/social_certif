import { Event } from "@/types/event";

export default function EventHeader({ event }: { event: Event }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
      <p className="text-sm text-gray-600 mt-1">{event.description}</p>
      <p className="text-xs text-gray-400 mt-1">
        🗓 {new Date(event.event_time).toLocaleString('fr')}
      </p>
      <p className="text-xs text-gray-500 mt-1">
        👤 Created by <span className="font-medium text-gray-700">{event.creator_nickname}</span>
      </p>
    </div>
  );
}
