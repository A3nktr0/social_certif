"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import api from "@/lib/services/axios";
import { useAuth } from "@/context/AuthContext";
import { Group } from "@/types/group";
import { Post } from "@/types/post";
import GroupHeader from "@/components/groups/GroupHeader";
import GroupTabs from "@/components/groups/GroupTabs";
import GroupActions from "@/components/groups/GroupActions";
import GroupContent from "@/components/groups/GroupContent";
import InviteModal from "@/components/groups/InviteModal";
import EditGroupModal from "@/components/groups/EditGroupModal";

type TabOption = "posts" | "events" | "members";

export default function GroupDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();

  const [group, setGroup] = useState<Group | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState("");
  const [showPostForm, setShowPostForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [tab, setTab] = useState<TabOption>("posts");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [joinRequested, setJoinRequested] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading]);

  const fetchGroup = async () => {
    try {
      const res = await api.get(`/groups/${id}`);
      setGroup(Array.isArray(res.data) ? res.data[0] : res.data);
    } catch (err: any) {
      setError(err?.response?.data || "Failed to load group.");
    }
  };

  useEffect(() => {
    if (user && id) fetchGroup();
  }, [user, id]);

  const fetchPosts = async () => {
    try {
      const res = await api.get(`/groups/${id}/posts`);
      setPosts(Array.isArray(res.data) ? res.data : []);
    } catch {
      console.error("Failed to load posts");
    }
  };

  useEffect(() => {
    if (group?.is_member) fetchPosts();
  }, [group]);

  const handleRequestJoin = async () => {
    try {
      await api.post(`/groups/${id}/join`);
      setJoinRequested(true);
    } catch (err) {
      console.error("Join request failed", err);
    }
  };

  const handleDeleteGroup = async () => {
    const confirmDelete = confirm("Are you sure you want to delete this group?");
    if (!confirmDelete) return;

    try {
      await api.delete(`/groups/${id}`);
      router.push("/groups");
    } catch (err) {
      alert("Failed to delete group.");
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6 bg-white rounded-xl p-6 shadow-md">
        {error && <p className="text-center text-red-500">{error}</p>}

        {group && (
          <>
            <GroupHeader group={group} />

            {!group.is_member && (
              <div className="flex justify-center mt-4">
                {joinRequested ? (
                  <p className="text-sm text-green-600 font-medium">
                    Request sent ✅
                  </p>
                ) : (
                  <button
                    onClick={handleRequestJoin}
                    className="px-5 py-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white text-sm shadow transition cursor-pointer"
                  >
                    Request to Join Group
                  </button>
                )}
              </div>
            )}

            {group.is_member && (
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm shadow transition"
                >
                  Invite Users
                </button>

                {group.is_admin && (
                  <>
                    <button
                      onClick={() => setShowEditModal(true)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-full text-sm shadow"
                    >
                      Edit Group
                    </button>
                    <button
                      onClick={handleDeleteGroup}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full text-sm shadow"
                    >
                      Delete Group
                    </button>
                  </>
                )}
              </div>
            )}

            <GroupTabs tab={tab} setTab={setTab} />

            {group.is_member && (
              <GroupActions
                groupId={group.id}
                showPostForm={showPostForm}
                setShowPostForm={setShowPostForm}
                showEventForm={showEventForm}
                setShowEventForm={setShowEventForm}
                onPostCreated={fetchPosts}
              />
            )}

            <GroupContent
              tab={tab}
              isMember={group.is_member}
              groupId={group.id}
              posts={posts}
              isAdmin={group.is_admin}
            />

            {showInviteModal && (
              <InviteModal
                groupId={group.id}
                onClose={() => setShowInviteModal(false)}
              />
            )}

            {showEditModal && group && (
              <EditGroupModal
                group={group}
                onClose={() => setShowEditModal(false)}
                onUpdated={fetchGroup}
              />
            )}
          </>
        )}
      </div>
    </main>
  );
}
