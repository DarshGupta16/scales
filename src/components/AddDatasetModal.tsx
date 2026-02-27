import { useState } from "react";
import { Modal } from "./Modal";
import { UnitSelector } from "./UnitSelector";
import type { Dataset, Unit } from "../types/dataset";
import { useTRPC } from "../trpc/client";
import { useMutation } from "@tanstack/react-query";

interface AddDatasetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDatasetCreated: (dataset: Dataset) => void;
}

export function AddDatasetModal({
  isOpen,
  onClose,
  onDatasetCreated,
}: AddDatasetModalProps) {
  const trpc = useTRPC();
  const upsertDataset = useMutation(trpc.upsertDataset.mutationOptions());

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState<Unit>("count");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const slug = title.toLowerCase().replace(/\s+/g, "-");
    const newDataset: Dataset = {
      id: `${slug}-${Math.random().toString(36).substring(7)}`,
      slug,
      title,
      description,
      unit,
      views: ["line"],
      measurements: [],
    };

    upsertDataset.mutate(newDataset);
    onDatasetCreated(newDataset);

    // Reset and close
    setTitle("");
    setDescription("");
    setUnit("count");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Collection">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1">
            Title
          </label>
          <input
            autoFocus
            type="text"
            required
            placeholder="e.g. Daily Momentum"
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

        <button type="submit" className="mt-4 brutal-btn-brand py-4 w-full">
          Create Tracker
        </button>
      </form>
    </Modal>
  );
}
