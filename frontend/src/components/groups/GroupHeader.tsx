import { Group } from "@/types/group";

export default function GroupHeader({ group }: { group: Group }) {
  return (
    <div className="flex items-center gap-6 border-b pb-6">
      <img
        src={group.avatar || "/static/avatars/default.jpg"}
        alt="group avatar"
        className="w-24 h-24 rounded-full object-cover border-4 border-blue-500 shadow-md"
      />
      <div className="flex-1">
        <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
        <p className="text-sm text-gray-500 mt-2">{group.description}</p>
      </div>
    </div>
  );
}
