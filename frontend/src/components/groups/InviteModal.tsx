"use client";

import { useEffect, useState } from "react";
import api from "@/lib/services/axios";
import { BaseUser } from "@/types/user";

interface Props {
  groupId: string;
  onClose: () => void;
}

export default function InviteModal({ groupId, onClose }: Props) {
  const [users, setUsers] = useState<BaseUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [invitingId, setInvitingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get(`/groups/${groupId}/invite-options`);
        setUsers(Array.isArray(res.data) ? res.data : []);
      } catch {
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [groupId]);

  const inviteUser = async (userId: string) => {
    setInvitingId(userId);
    try {
      await api.post(`/groups/${groupId}/invite/${userId}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      console.error("Invite failed", err);
    } finally {
      setInvitingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-md rounded-t-xl sm:rounded-xl overflow-hidden shadow-lg">
        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Invite Users</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="px-5 py-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <p className="text-sm text-gray-500 text-center">Loading...</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-gray-500 text-center">No eligible users to invite.</p>
          ) : (
            <ul className="space-y-4">
              {users.map((user) => (
                <li key={user.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={user.avatar}
                      alt="avatar"
                      className="w-10 h-10 rounded-full object-cover border"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">@{user.nickname}</p>
                      <p className="text-xs text-gray-500">{user.first_name} {user.last_name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => inviteUser(user.id)}
                    disabled={invitingId === user.id}
                    className="text-sm px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition"
                  >
                    {invitingId === user.id ? "Inviting..." : "Invite"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
