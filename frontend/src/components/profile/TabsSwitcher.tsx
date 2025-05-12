export default function TabsSwitcher({
    tab,
    setTab,
    followerCount,
    followingCount,
  }: {
    tab: "followers" | "following";
    setTab: (t: "followers" | "following") => void;
    followerCount: number;
    followingCount: number;
  }) {
    return (
      <div className="flex justify-center gap-6 mt-4">
        <button
          onClick={() => setTab("followers")}
          className={`text-sm px-3 py-1 rounded ${
            tab === "followers" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"
          }`}
        >
          Followers ({followerCount})
        </button>
        <button
          onClick={() => setTab("following")}
          className={`text-sm px-3 py-1 rounded ${
            tab === "following" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"
          }`}
        >
          Following ({followingCount})
        </button>
      </div>
    );
  }
  