import api from "@/lib/services/axios";

export const fetchNotifications = async () => {
  const res = await api.get("/notifications");
  return res.data;
};

export const deleteNotification = async (id: string) => {
  await api.delete(`/notifications/${id}`);
};

export const markAsRead = async (id: string) => {
  await api.patch(`/notifications/${id}/read`);
};

export const acceptFollow = async (userId: string) => {
  await api.post(`/follow/accept/${userId}`);
};

export const rejectFollow = async (userId: string) => {
  await api.post(`/follow/reject/${userId}`);
};

export const acceptGroupInvite = async (groupId: string) => {
  await api.post(`/groups/${groupId}/accept-invite` );
};

export const rejectGroupInvite = async (groupId: string) => {
  await api.post(`/groups/${groupId}/reject-invite`);
};

export const acceptGroupJoinRequest = async (
  groupId: string,
  userId: string,
) => {
  await api.post(`/groups/${groupId}/accept-request/${userId}`);
};

export const rejectGroupJoinRequest = async (
  groupId: string,
  userId: string,
) => {
  await api.post(`/groups/${groupId}/reject-request/${userId}`);
};