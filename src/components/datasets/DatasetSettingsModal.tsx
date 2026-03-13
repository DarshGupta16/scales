import { useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { UnitSelector } from "../ui/UnitSelector";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Trash2 } from "lucide-react";
import type { Dataset, Unit } from "../../types/dataset";

interface DatasetSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataset: Dataset;
  onUpdate: (updatedDataset: Dataset) => void;
  onDelete: (id: string) => void;
}

export function DatasetSettingsModal({
  isOpen,
  onClose,
  dataset,
  onUpdate,
  onDelete,
}: DatasetSettingsModalProps) {
  const [title, setTitle] = useState(dataset.title);
  const [description, setDescription] = useState(dataset.description);
  const [unit, setUnit] = useState<Unit>(dataset.unit);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  // Sync state with dataset when it changes or when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle(dataset.title);
      setDescription(dataset.description);
      setUnit(dataset.unit);
    }
  }, [isOpen, dataset]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    onUpdate({
      ...dataset,
      title,
      description,
      unit,
    });
    onClose();
  };

  const handleDelete = () => {
    onDelete(dataset.id);
    setIsConfirmDeleteOpen(false);
    onClose();
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Collection Settings">
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1">
                Title
              </label>
              <input
                type="text"
                required
                placeholder="Collection title"
                className="brutal-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1">
                Description
              </label>
              <textarea
                rows={3}
                placeholder="What defines this metric?"
                className="brutal-input resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1">
                Unit
              </label>
              <UnitSelector value={unit} onChange={setUnit} />
            </div>
          </div>

          <div className="h-px bg-white/5 w-full" />

          <div className="flex flex-col gap-4">
            <button type="submit" className="brutal-btn-brand py-4 w-full">
              Save Changes
            </button>

            <button
              type="button"
              onClick={() => setIsConfirmDeleteOpen(true)}
              className="flex items-center justify-center gap-2 py-4 px-6 text-zinc-500 hover:text-red-400 border border-white/5 hover:border-red-500/30 hover:bg-red-500/5 transition-all rounded-xl font-bold uppercase tracking-widest text-[10px]"
            >
              <Trash2 className="w-4 h-4" />
              Delete Collection
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Destroy Collection"
        message={`Are you absolutely certain you wish to destroy "${dataset.title}"? This operation is irreversible and all recorded metrics will be purged from the archive.`}
        confirmText="Destroy Permanently"
        type="danger"
      />
    </>
  );
}
