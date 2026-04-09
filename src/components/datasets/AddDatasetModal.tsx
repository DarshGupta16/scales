import { useState, useEffect } from "react";
import { useDatasetStore } from "@/store";
import type { Dataset, Unit, Metric } from "../../types/dataset";
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
  const [type, setType] = useState<"single" | "composite">("single");
  const [singleUnit, setSingleUnit] = useState<Unit | null>(null);
  const [metrics, setMetrics] = useState<{ id: string; name: string; unit: Unit | null }[]>(() => [
    { id: generatePbId(), name: "", unit: null }
  ]);

  // Reset form state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setDescription("");
      setType("single");
      setSingleUnit(null);
      setMetrics([{ id: generatePbId(), name: "", unit: null }]);
    }
  }, [isOpen]);

  const addMetric = () => {
    setMetrics([...metrics, { id: generatePbId(), name: "", unit: null }]);
  };

  const removeMetric = (index: number) => {
    if (metrics.length > 1) {
      setMetrics(metrics.filter((_, i) => i !== index));
    }
  };

  const updateMetric = (index: number, updates: Partial<{ name: string; unit: Unit | null }>) => {
    setMetrics(
      metrics.map((m, i) => (i === index ? { ...m, ...updates } : m))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const datasetId = generatePbId();
    const now = Date.now();

    if (type === "single") {
      const selectedUnit = singleUnit || units[0];
      if (!selectedUnit) return;

      const metric: Metric = {
        id: generatePbId(),
        name: "Value",
        unit: selectedUnit,
      };

      const newDataset: Dataset = {
        id: datasetId,
        title,
        description,
        type: "single",
        metrics: [metric],
        unit: metric.unit,
        measurements: [],
        views: ["line"],
        created: now,
        updated: now,
      };
      onAdd(newDataset);
    } else {
      const validMetrics: Metric[] = metrics
        .filter((m) => m.name.trim() && (m.unit || units[0]))
        .map((m) => ({
          id: m.id,
          name: m.name.trim(),
          unit: m.unit || units[0]!,
        }));

      if (validMetrics.length === 0) return;

      const newDataset: Dataset = {
        id: datasetId,
        title,
        description,
        type: "composite",
        metrics: validMetrics,
        unit: validMetrics[0].unit,
        measurements: [],
        views: ["line"],
        created: now,
        updated: now,
      };
      onAdd(newDataset);
    }

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Collection">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Mode Toggle */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1">
            Collection Type
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-900/50 rounded-2xl border border-white/5">
            <button
              type="button"
              onClick={() => setType("single")}
              className={`py-3 px-6 rounded-xl font-bold transition-all ${
                type === "single"
                  ? "bg-brand text-white shadow-lg shadow-brand/20"
                  : "text-zinc-500 hover:text-white hover:bg-white/5"
              }`}
            >
              Single
            </button>
            <button
              type="button"
              onClick={() => setType("composite")}
              className={`py-3 px-6 rounded-xl font-bold transition-all ${
                type === "composite"
                  ? "bg-brand text-white shadow-lg shadow-brand/20"
                  : "text-zinc-500 hover:text-white hover:bg-white/5"
              }`}
            >
              Composite
            </button>
          </div>
        </div>

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
            placeholder={type === "single" ? "e.g. Daily Momentum" : "e.g. Fitness Performance"}
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
            rows={2}
            placeholder="What defines this metric?"
            className="brutal-input resize-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {type === "single" ? (
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1">
              Unit
            </span>
            <UnitSelector value={singleUnit || units[0] || null} onChange={setSingleUnit} />
          </div>
        ) : (
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
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  )}
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.15em]">
                      Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Breath Hold"
                      className="brutal-input py-2 text-sm"
                      value={m.name}
                      onChange={(e) => updateMetric(index, { name: e.target.value })}
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.15em]">
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
        )}

        <button type="submit" className="mt-4 brutal-btn-brand py-4 w-full">
          Create Tracker
        </button>
      </form>
    </Modal>
  );
}
