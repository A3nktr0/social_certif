"use client";

interface Props {
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmModal({ title, message, onCancel, onConfirm }: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 text-center">
        <h2 className="text-2xl font-semibold text-gray-800">{title}</h2>
        <p className="text-sm text-gray-600">{message}</p>

        <div className="flex justify-center gap-4 pt-2">
          <button
            onClick={onCancel}
            className="text-sm px-4 py-1.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-1.5 rounded-xl transition"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
