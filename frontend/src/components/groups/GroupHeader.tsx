import { Group } from "@/types/group";
import Image from "next/image";

export default function GroupHeader({ group }: { group: Group }) {
  return (
    <div className="flex items-center gap-6 border-b pb-6">
      <Image
        src={group.avatar || "/static/avatars/default.jpg"}
        alt={`${group.name || 'Group'} avatar`}
        width={96}
        height={96}
        className="rounded-full object-cover border-4 border-blue-500 shadow-md"
        priority
        unoptimized={true}
        onError={(e) => {
          // Fallback to default image if there's an error loading the user avatar
          const target = e.target as HTMLImageElement;
          target.onerror = null;
          target.src = "/static/avatars/default.jpg";
        }}

      />
      <div className="flex-1">
        <h1 className="text-2xl font-bold text-gray-900">{group.name || 'Unnamed Group'}</h1>
        <p className="text-sm text-gray-500 mt-2">{group.description || 'No description available'}</p>
      </div>
    </div>
  );
}
