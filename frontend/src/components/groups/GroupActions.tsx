import GroupPostForm from "./GroupPostForm";
import GroupEventForm from "./GroupEventForm";

interface Props {
  groupId: string;
  showPostForm: boolean;
  setShowPostForm: (v: boolean) => void;
  showEventForm: boolean;
  setShowEventForm: (v: boolean) => void;
  onPostCreated: () => void;
}

export default function GroupActions({
  groupId,
  showPostForm,
  setShowPostForm,
  showEventForm,
  setShowEventForm,
  onPostCreated,
}: Props) {
  return (
    <>
      <div className="flex flex-wrap gap-3 mb-4">
        <button
          onClick={() => setShowPostForm((v) => !v)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full text-sm shadow transition cursor-pointer"
        >
          {showPostForm ? "Cancel Post" : "+ Create Post"}
        </button>
        <button
          onClick={() => setShowEventForm((v) => !v)}
          className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-full text-sm shadow transition cursor-pointer"
        >
          {showEventForm ? "Cancel Event" : "+ Create Event"}
        </button>
      </div>

      {showPostForm && (
        <div className="mb-6 border rounded-xl p-4 bg-gray-50">
          <GroupPostForm groupId={groupId} onPostCreated={onPostCreated} />
        </div>
      )}

      {showEventForm && (
        <div className="mb-6 border rounded-xl p-4 bg-gray-50">
          <GroupEventForm groupId={groupId} onEventCreated={setShowEventForm.bind(null, false)} />
        </div>
      )}
    </>
  );
}
