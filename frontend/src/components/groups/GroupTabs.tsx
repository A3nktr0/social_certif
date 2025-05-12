type TabOption = "posts" | "events" | "members";

export default function GroupTabs({
  tab,
  setTab,
}: {
  tab: TabOption;
  setTab: (tab: TabOption) => void;
}) {
  const tabs: TabOption[] = ["posts", "events", "members"];
  return (
    <div className="mt-6 border-b pb-2 flex gap-6">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => setTab(t)}
          className={`text-sm font-medium pb-1 border-b-2 ${
            tab === t
              ? "text-blue-600 border-blue-600"
              : "text-gray-500 border-transparent hover:text-blue-600"
          }`}
        >
          {t.charAt(0).toUpperCase() + t.slice(1)}
        </button>
      ))}
    </div>
  );
}
