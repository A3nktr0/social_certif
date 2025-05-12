"use client";

import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/services/axios";
import Link from "next/link";
import FollowersPanel from "@/components/profile/FollowersPanel";
import FollowingPanel from "@/components/profile/FollowingPanel";
import AvatarSection from "@/components/profile/AvatarSection";
import ProfileHeader from "@/components/profile/ProfileHeader";
import TabsSwitcher from "@/components/profile/TabsSwitcher";
import { useEffect, useState } from "react";
import { Profile } from "@/types/profile";
import { useRouter } from "next/navigation";
import { Post } from "@/types/post";
import PostCard from "@/components/posts/PostCard";

export default function ProfilePage() {
  const params = useParams();
  const rawId = params?.id;
  const id = typeof rawId === "string" ? rawId.trim() : "";
  const safeId = encodeURIComponent(id);

  const { user, setUser, loading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"followers" | "following">("followers");
  const [stats, setStats] = useState<
    { followers: number; following: number } | null
  >(null);
  const isOwnProfile = user?.id === id;
  const [followStatus, setFollowStatus] = useState<
    "none" | "pending" | "accepted"
  >("none");
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  const fetchStats = async () => {
    if (!isOwnProfile) return;
    try {
      const res = await api.get("/follow/stats");
      setStats(res.data);
    } catch {
      // silent fail
    }
  };

  useEffect(() => {
    fetchStats();
  }, [isOwnProfile]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/profile/${safeId}`);
        setProfile(res.data);

        // Also fetch follow status if viewing another user's profile
        if (!isOwnProfile) {
          const followRes = await api.get(`/follow/status/${safeId}`);
          setFollowStatus(followRes.data.status);
        }
      } catch (err: any) {
        const msg = err?.response?.data || "Unable to load profile";
        setError(msg);
      }
    };
    const fetchUserPosts = async () => {
      try {
        const res = await api.get(`/posts/by-user/${safeId}`);
        setPosts(Array.isArray(res.data) ? res.data : []);
      } catch {
        // ignore silently
      }
    };

    if (safeId) {
      fetchProfile();
      fetchUserPosts();
    }
  }, [safeId, isOwnProfile]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("avatar", file);
    try {
      await api.post("/upload/avatar", fd);
      const updated = await api.get("/me");
      setProfile(updated.data);
      setUser(updated.data);
    } catch (err: any) {
      const msg = err?.response?.data || "Unable to upload avatar";
      setError(msg);
    }
  };

  const handleFollow = async () => {
    try {
      await api.post(`/follow/${safeId}`);
      if (profile?.is_private) {
        setFollowStatus("pending");
      } else {
        setFollowStatus("accepted");
      }
    } catch {
      alert("Failed to follow user.");
    }
  };

  const handleUnfollow = async () => {
    try {
      await api.post(`/follow/unfollow/${safeId}`);
      setFollowStatus("none");
    } catch {
      alert("Failed to unfollow user.");
    }
  };

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-10 text-center text-red-500">
        {error}
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto mt-10 text-center text-gray-500">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
        {/* Left: Profile Info Panel */}
        <aside className="w-full lg:w-1/3 bg-white rounded-xl shadow p-6 space-y-6">
          <AvatarSection
            avatarUrl={profile.avatar}
            isOwnProfile={isOwnProfile}
            onChange={handleAvatarChange}
          />
          <ProfileHeader
            profile={profile}
            stats={stats}
            isOwnProfile={isOwnProfile}
            followStatus={followStatus}
          />
  
          {!isOwnProfile && (
            <div>
              {followStatus === "none" && (
                <button
                  onClick={handleFollow}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 rounded"
                >
                  Follow
                </button>
              )}
              {followStatus === "pending" && (
                <button
                  disabled
                  className="w-full bg-gray-400 text-white text-sm py-2 rounded cursor-not-allowed"
                >
                  Request Sent
                </button>
              )}
              {followStatus === "accepted" && (
                <button
                  onClick={handleUnfollow}
                  className="w-full bg-red-500 hover:bg-red-600 text-white text-sm py-2 rounded"
                >
                  Unfollow
                </button>
              )}
            </div>
          )}
  
          {isOwnProfile && (
            <>
              <Link
                href="/profile/edit"
                className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 rounded"
              >
                Edit Profile
              </Link>
  
              <TabsSwitcher
                tab={tab}
                setTab={setTab}
                followerCount={stats?.followers || 0}
                followingCount={stats?.following || 0}
              />
  
              {tab === "followers"
                ? <FollowersPanel refreshStats={fetchStats} />
                : <FollowingPanel refreshStats={fetchStats} />}
            </>
          )}
        </aside>
  
        {/* Right: User Activity Feed */}
        <main className="flex-1 space-y-6">
          <h2 className="text-xl font-semibold text-gray-800">User Activity</h2>
          {posts.length === 0 ? (
            <p className="text-sm text-gray-500">No posts yet.</p>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
  
}
