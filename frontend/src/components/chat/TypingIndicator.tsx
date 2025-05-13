export default function TypingIndicator({ name }: { name: string }) {
    return (
      <div className="text-xs text-gray-600 italic pl-2 pt-1 animate-pulse">
        {name} is typing...
      </div>
    );
  }
  