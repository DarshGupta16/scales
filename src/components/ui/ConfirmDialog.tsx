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
  confirmText = "CONFIRM",
  type = "primary",
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col gap-10">
        <p className="text-zinc-400 font-sans uppercase tracking-[0.15em] text-xs leading-relaxed border-l-2 border-brand/50 pl-6">
          {message}
        </p>
        <div className="flex justify-end gap-4 mt-2">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-white/5 text-zinc-400 font-bold uppercase tracking-widest text-xs hover:bg-white/10 hover:text-white transition-all rounded-xl"
          >
            Abort
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`
              px-6 py-3 font-bold uppercase tracking-widest text-xs transition-all rounded-xl shadow-lg
              ${
                type === "danger"
                  ? "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white"
                  : "bg-brand text-white shadow-brand/20 hover:brightness-110"
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
