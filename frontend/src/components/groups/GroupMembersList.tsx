"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/services/axios";
import MemberCard from "./MemberCard";
import ConfirmModal from "@/components/common/ConfirmModal";

interface Member {
  id: string;
  nickname: string;
  avatar: string;
  is_admin: boolean;
}

interface Props {
  groupId: string;
  isAdmin: boolean;
}

export default function GroupMembersList({ groupId, isAdmin }: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState("");
  const [pendingRemovalId, setPendingRemovalId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await api.get(`/groups/${groupId}/members`);
      setMembers(Array.isArray(res.data) ? res.data : []);
    } catch {
      setError("Failed to load group members.");
    }
  }, [groupId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const confirmRemove = (userId: string) => {
    setPendingRemovalId(userId);
    setShowConfirm(true);
  };

  const performRemoval = async () => {
    if (!pendingRemovalId) return;

    try {
      await api.delete(`/groups/${groupId}/members/${pendingRemovalId}`);
      fetchMembers();
    } catch {
      setError("Failed to remove member.");
    } finally {
      setShowConfirm(false);
      setPendingRemovalId(null);
    }
  };

  const pendingNickname = members.find((m) => m.id === pendingRemovalId)?.nickname;

  return (
    <div className="space-y-4">
      {error && <p className="text-red-500 text-sm">{error}</p>}

      {members.length === 0 ? (
        <p className="text-sm text-gray-500">No members in this group.</p>
      ) : (
        members.map((m) => (
          <MemberCard key={m.id} member={m} canRemove={isAdmin && !m.is_admin} onRemove={confirmRemove} />
        ))
      )}

      {showConfirm && pendingRemovalId && (
        <ConfirmModal
          title="Confirm Removal"
          message={`Are you sure you want to remove @${pendingNickname} from the group?`}
          onCancel={() => setShowConfirm(false)}
          onConfirm={performRemoval}
        />
      )}
    </div>
  );
}
