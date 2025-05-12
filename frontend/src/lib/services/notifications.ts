// lib/api/notifications.ts

export const fetchNotifications = async () => {
  const res = await fetch("/api/notifications", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch notifications");
  return await res.json();
};

export const deleteNotification = async (id: string) => {
  await fetch(`/api/notifications/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
};

export const markAsRead = async (id: string) => {
  await fetch(`/api/notifications/${id}/read`, {
    method: "PATCH",
    credentials: "include",
  });
};

export const acceptFollow = async (userId: string) => {
  await fetch(`/api/follow/accept/${userId}`, {
    method: "POST",
    credentials: "include",
  });
};

export const rejectFollow = async (userId: string) => {
  await fetch(`/api/follow/reject/${userId}`, {
    method: "POST",
    credentials: "include",
  });
};

export const acceptGroupInvite = async (groupId: string) => {
  await fetch(`/api/groups/${groupId}/accept-invite`, {
    method: "POST",
    credentials: "include",
  });
};

export const rejectGroupInvite = async (groupId: string) => {
  await fetch(`/api/groups/${groupId}/reject-invite`, {
    method: "POST",
    credentials: "include",
  });
};

export const acceptGroupJoinRequest = async (
  groupId: string,
  userId: string,
) => {
  await fetch(`/api/groups/${groupId}/accept-request/${userId}`, {
    method: "POST",
    credentials: "include",
  });
};

export const rejectGroupJoinRequest = async (
  groupId: string,
  userId: string,
) => {
  await fetch(`/api/groups/${groupId}/reject-request/${userId}`, {
    method: "POST",
    credentials: "include",
  });
};
