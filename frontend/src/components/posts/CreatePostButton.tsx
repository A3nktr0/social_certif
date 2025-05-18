import Link from "next/link";
import { Plus } from "lucide-react";
export default function CreatePostButton() {
  return (
    <Link
      href="/post/create"
      className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg z-50 transition-all"
      title="Create a post"
    >
      <Plus className="w-5 h-5" />
      <span className="sr-only">Create a post</span>
    </Link>
  );
}
