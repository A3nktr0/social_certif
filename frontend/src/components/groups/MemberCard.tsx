import Image from "next/image";

interface Props {
    member: {
      id: string;
      nickname: string;
      avatar: string;
      is_admin: boolean;
    };
    canRemove?: boolean;
    onRemove?: (id: string) => void;
  }
  
  export default function MemberCard({ member, canRemove, onRemove }: Props) {
    return (
      <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10">
            <Image
              src={member.avatar || "/static/avatars/default.jpg"}
              alt={`${member.nickname}'s avatar`}
              className="rounded-full border object-cover"
              fill
              sizes="40px"
              unoptimized={true}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = "/static/avatars/default.jpg";
              }}
            />
          </div>
          <div>
            <p className="font-medium text-sm text-gray-900">@{member.nickname}</p>
            <p className="text-xs text-gray-500">{member.is_admin ? "Admin" : "Member"}</p>
          </div>
        </div>
  
        {canRemove && onRemove && (
          <button
            onClick={() => onRemove(member.id)}
            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-full text-sm shadow transition"
          >
            Remove
          </button>
        )}
      </div>
    );
  }
  