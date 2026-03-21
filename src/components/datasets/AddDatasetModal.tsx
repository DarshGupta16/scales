import { useState } from "react";
import { useDatasetStore } from "@/store";
import type { Dataset, Unit } from "../../types/dataset";
import { generatePbId } from "../../utils/id";
import { Modal } from "../ui/Modal";
import { UnitSelector } from "../ui/UnitSelector";

interface AddDatasetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (dataset: Dataset) => void;
}

export function AddDatasetModal({ isOpen, onClose, onAdd }: AddDatasetModalProps) {
  const { units } = useDatasetStore();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState<Unit | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const selectedUnit = unit || units[0];
    if (!selectedUnit) return;

    const newDataset: Dataset = {
      id: generatePbId(),
      title,
      description,
      unit: selectedUnit,
      measurements: [],
      views: ["line"],
      created: Date.now(),
      updated: Date.now(),
    };

    onAdd(newDataset);

    // Reset form
    setTitle("");
    setDescription("");
    setUnit(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Collection">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="dataset-title"
            className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1"
          >
            Title
          </label>
          <input
            id="dataset-title"
            type="text"
            required
            placeholder="e.g. Daily Momentum"
            className="brutal-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="dataset-description"
            className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1"
          >
            Description
          </label>
          <textarea
            id="dataset-description"
            rows={3}
            placeholder="What defines this metric?"
            className="brutal-input resize-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1">
            Unit
          </span>
          <UnitSelector value={unit || units[0] || null} onChange={setUnit} />
        </div>

        <button type="submit" className="mt-4 brutal-btn-brand py-4 w-full">
          Create Tracker
        </button>
      </form>
    </Modal>
  );
}
