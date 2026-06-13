import type { Unit } from "../../../types/dataset";
import { UnitSelector } from "../../ui/UnitSelector";

interface MetricState {
  id: string;
  name: string;
  unit: Unit | null;
}

interface CompositeDatasetFormProps {
  title: string;
  setTitle: (title: string) => void;
  description: string;
  setDescription: (description: string) => void;
  metrics: MetricState[];
  addMetric: () => void;
  removeMetric: (index: number) => void;
  updateMetric: (index: number, updates: Partial<{ name: string; unit: Unit | null }>) => void;
  units: Unit[];
  onSubmit: (e: React.FormEvent) => void;
}

export function CompositeDatasetForm({
  title,
  setTitle,
  description,
  setDescription,
  metrics,
  addMetric,
  removeMetric,
  updateMetric,
  units,
  onSubmit,
}: CompositeDatasetFormProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label
          htmlFor="dataset-title-composite"
          className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1"
        >
          Title
        </label>
        <input
          id="dataset-title-composite"
          type="text"
          required
          placeholder="e.g. Fitness Performance"
          className="brutal-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="dataset-description-composite"
          className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1"
        >
          Description
        </label>
        <textarea
          id="dataset-description-composite"
          rows={2}
          placeholder="What defines this metric?"
          className="brutal-input resize-none"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between ml-1">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
            Metrics
          </span>
          <button
            type="button"
            onClick={addMetric}
            className="text-[10px] font-bold text-brand uppercase tracking-wider hover:underline"
          >
            + Add Metric
          </button>
        </div>

        <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-2 pb-24 custom-scrollbar">
          {metrics.map((m, index) => (
            <div
              key={m.id}
              className="flex flex-col gap-3 p-4 bg-zinc-900/30 rounded-2xl border border-white/5 relative group"
              style={{ zIndex: metrics.length - index }}
            >
              {metrics.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMetric(index)}
                  className="absolute top-4 right-4 text-zinc-600 hover:text-danger transition-colors opacity-0 group-hover:opacity-100"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <title>Delete Metric</title>
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  </svg>
                </button>
              )}

              <div className="flex flex-col gap-2">
                <label
                  htmlFor={`metric-name-${index}`}
                  className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.15em]"
                >
                  Name
                </label>
                <input
                  id={`metric-name-${index}`}
                  type="text"
                  placeholder="e.g. Breath Hold"
                  className="brutal-input py-2 text-sm"
                  value={m.name}
                  onChange={(e) => updateMetric(index, { name: e.target.value })}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor={`metric-unit-${index}`}
                  className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.15em]"
                >
                  Unit
                </label>
                <UnitSelector
                  value={m.unit || units[0] || null}
                  onChange={(u) => updateMetric(index, { unit: u })}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <button type="submit" className="mt-4 brutal-btn-brand py-4 w-full">
        Create Tracker
      </button>
    </form>
  );
}
