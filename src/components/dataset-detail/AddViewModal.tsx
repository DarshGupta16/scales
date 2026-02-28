import { Modal } from "../Modal";
import { Plus } from "lucide-react";
import type { ViewType } from "../../types/dataset";

interface AddViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddView: (view: ViewType) => void;
  existingViews: ViewType[];
}

const AVAILABLE_VIEW_TYPES: ViewType[] = [
  "line",
  "bar",
  "area",
  "pie",
  "scatter",
];

export function AddViewModal({
  isOpen,
  onClose,
  onAddView,
  existingViews,
}: AddViewModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Initialize Module"
    >
      <div className="grid grid-cols-1 gap-4">
        {AVAILABLE_VIEW_TYPES.map((view) => {
          const isAlreadyAdded = existingViews.includes(view);
          return (
            <button
              key={view}
              disabled={isAlreadyAdded}
              onClick={() => onAddView(view)}
              className={`
                flex items-center justify-between p-6 border transition-all text-left uppercase tracking-[0.2em] font-bold text-[10px] rounded-[1.5rem]
                ${
                  isAlreadyAdded
                    ? "bg-white/5 border-white/5 text-zinc-700 cursor-not-allowed"
                    : "bg-zinc-900/50 border-white/10 text-zinc-400 hover:border-brand/50 hover:text-white hover:pl-8 group shadow-xl"
                }
              `}
            >
              <span>{view} Processor</span>
              {isAlreadyAdded ? (
                <span className="text-[8px] bg-white/5 text-zinc-600 px-3 py-1 rounded-full">
                  Active
                </span>
              ) : (
                <Plus className="w-4 h-4 text-brand opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
