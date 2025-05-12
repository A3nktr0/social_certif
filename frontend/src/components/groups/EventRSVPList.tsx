"use client";

import { useAuth } from "@/context/AuthContext";

interface RSVP {
  user_id: string;
  nickname: string;
  avatar: string;
  response: "going" | "not_going";
}

export default function EventRSVPList({ rsvps }: { rsvps: RSVP[] }) {
  const { user } = useAuth(); // Assumes your auth context provides `user.id`

  const count = (type: "going" | "not_going") =>
    rsvps.filter((r) => r.response === type).length;

  const currentUserRsvp = rsvps.find((r) => r.user_id === user?.id)?.response;

  return (
    <section>
      <h3 className="text-sm font-semibold text-gray-700 mb-2">RSVP Stats</h3>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 text-sm">
        <div className="flex gap-4">
          <span className="text-green-600">✅ Going: {count("going")}</span>
          <span className="text-red-500">❌ Not Going: {count("not_going")}</span>
        </div>
        {currentUserRsvp && (
          <p className="text-xs text-gray-500 italic">
            Your response:{" "}
            <span className={currentUserRsvp === "going" ? "text-green-600" : "text-red-500"}>
              {currentUserRsvp === "going" ? "Going" : "Not going"}
            </span>
          </p>
        )}
      </div>

      <ul className="space-y-2 max-h-60 overflow-y-auto">
        {rsvps.map((r) => (
          <li
            key={r.user_id}
            className={`flex items-center gap-3 bg-gray-50 p-2 rounded ${
              r.user_id === user?.id ? "border border-blue-500" : ""
            }`}
          >
            <img
              src={r.avatar || "/static/avatars/default.jpg"}
              className="w-9 h-9 rounded-full border object-cover"
              alt={`@${r.nickname}`}
            />
            <span className="text-sm text-gray-800">@{r.nickname}</span>
            <span
              className={`ml-auto text-xs ${
                r.response === "going" ? "text-green-600" : "text-red-500"
              }`}
            >
              {r.response === "going" ? "Going" : "Not going"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
