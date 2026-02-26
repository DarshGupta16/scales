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
      <div className="flex flex-col gap-8">
        <p className="text-zinc-300 font-sans uppercase tracking-widest text-sm leading-relaxed border-l-4 border-white pl-4">
          {message}
        </p>
        <div className="flex justify-end gap-4 mt-2">
          <button
            onClick={onClose}
            className="px-6 py-3 border-2 border-white bg-black text-white font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all rounded-none"
          >
            ABORT
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`
              px-6 py-3 border-2 border-white font-bold uppercase tracking-widest transition-all rounded-none
              ${
                type === "danger"
                  ? "bg-[#ff3333] text-white shadow-[4px_4px_0_0_rgba(255,255,255,1)] hover:-translate-y-1 hover:translate-x-1 hover:shadow-[6px_6px_0_0_rgba(255,255,255,1)] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none"
                  : "bg-brand text-black shadow-[4px_4px_0_0_var(--color-brand)] hover:-translate-y-1 hover:translate-x-1 hover:shadow-[6px_6px_0_0_var(--color-brand)] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none"
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
