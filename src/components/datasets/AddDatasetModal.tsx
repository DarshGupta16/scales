import { useEffect, useState } from "react";
import { useDatasetStore } from "@/store";
import type { Dataset, Metric, Unit } from "../../types/dataset";
import { generatePbId } from "../../utils/id";
import { Modal } from "../ui/Modal";
import { CompositeDatasetForm } from "./forms/CompositeDatasetForm";
import { SingleDatasetForm } from "./forms/SingleDatasetForm";

interface AddDatasetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (dataset: Dataset) => void;
}

export function AddDatasetModal({ isOpen, onClose, onAdd }: AddDatasetModalProps) {
  const units = useDatasetStore((state) => state.unitIds.map((id) => state.unitsById[id]));
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"single" | "composite">("single");
  const [singleUnit, setSingleUnit] = useState<Unit | null>(null);
  const [metrics, setMetrics] = useState<{ id: string; name: string; unit: Unit | null }[]>(() => [
    { id: generatePbId(), name: "", unit: null },
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
    setMetrics(metrics.map((m, i) => (i === index ? { ...m, ...updates } : m)));
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
          unit: (m.unit || units[0]) as Unit,
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
      <div className="flex flex-col gap-6">
        {/* Mode Toggle */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1">
            Collection Type
          </span>
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

        {type === "single" ? (
          <SingleDatasetForm
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
            singleUnit={singleUnit}
            setSingleUnit={setSingleUnit}
            units={units}
            onSubmit={handleSubmit}
          />
        ) : (
          <CompositeDatasetForm
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
            metrics={metrics}
            addMetric={addMetric}
            removeMetric={removeMetric}
            updateMetric={updateMetric}
            units={units}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </Modal>
  );
}
