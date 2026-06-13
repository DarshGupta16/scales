import type { Unit } from "../../../types/dataset";
import { UnitSelector } from "../../ui/UnitSelector";

interface SingleDatasetFormProps {
  title: string;
  setTitle: (title: string) => void;
  description: string;
  setDescription: (description: string) => void;
  singleUnit: Unit | null;
  setSingleUnit: (unit: Unit | null) => void;
  units: Unit[];
  onSubmit: (e: React.FormEvent) => void;
}

export function SingleDatasetForm({
  title,
  setTitle,
  description,
  setDescription,
  singleUnit,
  setSingleUnit,
  units,
  onSubmit,
}: SingleDatasetFormProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label
          htmlFor="dataset-title-single"
          className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1"
        >
          Title
        </label>
        <input
          id="dataset-title-single"
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
          htmlFor="dataset-description-single"
          className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1"
        >
          Description
        </label>
        <textarea
          id="dataset-description-single"
          rows={2}
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
        <UnitSelector value={singleUnit || units[0] || null} onChange={setSingleUnit} />
      </div>

      <button type="submit" className="mt-4 brutal-btn-brand py-4 w-full">
        Create Tracker
      </button>
    </form>
  );
}
