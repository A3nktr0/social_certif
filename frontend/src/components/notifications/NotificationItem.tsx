"use client";

import {
  acceptFollow,
  acceptGroupInvite,
  acceptGroupJoinRequest,
  deleteNotification,
  markAsRead,
  rejectFollow,
  rejectGroupInvite,
  rejectGroupJoinRequest,
} from "@/lib/services/notifications";
import { useState } from "react";

interface Props {
  id: string;
  type: string;
  fromUserId: string;
  content: string;
  nickname: string;
  createdAt: string;
  data: Record<string, any>;
  onRemove: (id: string) => void;
  onCountUpdate: () => void;
}

export default function NotificationItem({
  id,
  type,
  fromUserId,
  content,
  nickname,
  createdAt,
  data,
  onRemove,
  onCountUpdate,
}: Props) {
  const [isProcessing, setProcessing] = useState(false);

  const handleDismiss = async () => {
    if (isProcessing) return;
    setProcessing(true);

    try {
      if (type !== "follow_request" && !isGroupAction(type)) {
        await deleteNotification(id);
        onCountUpdate();
        onRemove(id);
      } else {
        await markAsRead(id);
        onRemove(id);
        onCountUpdate();
      }
    } catch (err) {
      console.error("Notification dismiss failed:", err);
    } finally {
      setProcessing(false);
    }
  };

  const isGroupAction = (t: string) =>
    t === "group_invite" || t === "group_join_request";

  const extractGroupId = () => data?.group_id ?? "";
  const extractRequestedUserId = () => data?.user_id ?? "";

  const handleAccept = async () => {
    if (isProcessing) return;
    setProcessing(true);

    try {
      if (type === "follow_request") {
        await acceptFollow(fromUserId);
      } else if (type === "group_invite") {
        await acceptGroupInvite(extractGroupId());
      } else if (type === "group_join_request") {
        await acceptGroupJoinRequest(
          extractGroupId(),
          extractRequestedUserId(),
        );
      }

      onRemove(id);
      onCountUpdate();
    } catch (err) {
      console.error("Accept failed:", err);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (isProcessing) return;
    setProcessing(true);

    try {
      if (type === "follow_request") {
        await rejectFollow(fromUserId);
      } else if (type === "group_invite") {
        await rejectGroupInvite(extractGroupId());
      } else if (type === "group_join_request") {
        await rejectGroupJoinRequest(
          extractGroupId(),
          extractRequestedUserId(),
        );
      }

      onRemove(id);
      onCountUpdate();
    } catch (err) {
      console.error("Reject failed:", err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <li
      className="p-3 text-sm border-b hover:bg-gray-100 cursor-pointer"
      onClick={
        !["follow_request", "group_invite", "group_join_request"].includes(type)
          ? handleDismiss
          : undefined
      }
    >
      <div className="flex justify-between items-start text-gray-800">
        <div>
          {/* <strong>{first_name} {last_name}</strong>: {content} */}
          <strong>{nickname}</strong>: {content}
          <div className="text-xs text-gray-400 mt-1">
            {new Date(createdAt).toLocaleString('fr')}
          </div>
        </div>

        {["follow_request", "group_invite", "group_join_request"].includes(type) && (
          <div className="flex gap-1 ml-2">
            <button
              onClick={handleAccept}
              disabled={isProcessing}
              className="text-xs px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded"
            >
              Accept
            </button>
            <button
              onClick={handleReject}
              disabled={isProcessing}
              className="text-xs px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded"
            >
              Reject
            </button>
          </div>
        )}
      </div>
    </li>
  );
}
