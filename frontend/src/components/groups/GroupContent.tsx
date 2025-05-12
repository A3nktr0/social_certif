import { Post } from "@/types/post";
import { Event } from "@/types/event";
import PostCard from "../posts/PostCard";
import GroupMembersList from "./GroupMembersList";
import GroupEventCard from "./GroupEventCard";
import { useEffect, useState } from "react";
import api from "@/lib/services/axios";

interface Props {
  tab: "posts" | "events" | "members";
  isMember: boolean;
  isAdmin: boolean;
  posts: Post[];
  groupId: string;
}

export default function GroupContent({
  tab,
  isMember,
  isAdmin,
  posts,
  groupId,
}: Props) {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    if (tab === "events" && isMember) {
      api.get(`/groups/${groupId}/events`).then((res) => {
        setEvents(Array.isArray(res.data) ? res.data : []);
      });
    }
  }, [tab, groupId, isMember]);

  if (!isMember && tab !== "members") {
    return (
      <p className="text-blue-600 font-medium">
        Request access to view group {tab}.
      </p>
    );
  }

  if (tab === "posts") {
    return posts.length === 0 ? (
      <p className="text-sm text-gray-500">No posts yet in this group.</p>
    ) : (
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={{ ...post, visibility: "group" }} />
        ))}
      </div>
    );
  }

  if (tab === "events") {
    return events.length === 0 ? (
      <p className="text-sm text-gray-500">No events yet in this group.</p>
    ) : (
      <div className="space-y-4">
        {events.map((event) => (
          <GroupEventCard key={event.id} event={event} groupId={groupId} />
        ))}
      </div>
    );
  }

  return <GroupMembersList groupId={groupId} isAdmin={isAdmin} />;
}
