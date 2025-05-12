interface Props {
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmModal(
  { title, message, onCancel, onConfirm }: Props,
) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full max-w-sm mx-auto rounded-xl overflow-hidden shadow-lg sm:rounded-2xl sm:w-auto">
        <div className="px-6 py-5">
          <h3 className="text-base font-semibold text-center text-gray-900">
            {title}
          </h3>
          <p className="text-sm text-center text-gray-500 mt-2">{message}</p>
        </div>

        <div className="border-t border-gray-200 divide-y">
          <button
            onClick={onConfirm}
            className="w-full py-3 text-sm font-medium text-red-600 hover:bg-gray-100 active:bg-gray-200"
          >
            Confirm
          </button>
          <button
            onClick={onCancel}
            className="w-full py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 active:bg-gray-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
