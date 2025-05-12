import { Profile } from "@/types/profile";

export default function ProfileHeader({
  profile,
  stats,
  isOwnProfile,
  followStatus,
}: {
  profile: Profile;
  stats: { followers: number; following: number } | null;
  isOwnProfile: boolean;
  followStatus?: "none" | "pending" | "accepted";
}) {
  const canViewPrivate = isOwnProfile || followStatus === "accepted";
  const isPublicProfile = !profile.is_private;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800">
        {profile.first_name} {profile.last_name}
      </h1>

      {profile.nickname && (
        <p className="text-sm text-blue-600">@{profile.nickname}</p>
      )}

      {isOwnProfile && stats && (
        <p className="text-sm text-gray-600">
          <span className="font-medium text-gray-800">{stats.followers}</span>{" "}
          followers •{" "}
          <span className="font-medium text-gray-800">{stats.following}</span>{" "}
          following
        </p>
      )}

      {canViewPrivate || isPublicProfile ? (
        <>
          <p className="text-gray-600 text-sm">{profile.about || "No bio yet."}</p>
          {profile.dob && (
            <p className="text-xs text-gray-500">
              🎂 Date of Birth: {new Date(profile.dob).toLocaleDateString()}
            </p>
          )}
        </>
      ) : (
        <p className="text-xs text-red-500 font-medium mt-2">
          🔒 This is a private profile. Follow to request access.
        </p>
      )}
    </div>
  );
}