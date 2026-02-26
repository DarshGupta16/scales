import { Modal } from "./Modal";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  type?: "danger" | "primary";
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  type = "primary",
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col gap-6">
        <p className="text-slate-600 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`
              px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all shadow-md
              ${
                type === "danger"
                  ? "bg-red-500 hover:bg-red-600 shadow-red-100"
                  : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100"
              }
            `}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
