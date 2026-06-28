import { useState } from "react";
import { useDatasetStore } from "@/store";
import type { Dataset, Measurement, MeasurementValueRecord } from "../../types/dataset";
import { generatePbId } from "../../utils/id";
import { Modal } from "../ui/Modal";

interface AddMeasurementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (measurement: Measurement, values: MeasurementValueRecord[]) => void;
  dataset: Dataset;
}

export function AddMeasurementModal({ isOpen, onClose, onAdd, dataset }: AddMeasurementModalProps) {
  const metricsById = useDatasetStore((state) => state.metricsById);
  const metrics = dataset.metricIds.map((id) => metricsById[id]).filter(Boolean);

  const getLocalDatetimeLocal = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset(); // in minutes
    const local = new Date(now.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  };

  const [values, setValues] = useState<Record<string, string>>({});
  const [timestamp, setTimestamp] = useState(getLocalDatetimeLocal());
  // Track whether user manually changed the timestamp input.
  // datetime-local truncates to minutes, so if unchanged we use Date.now()
  // for full millisecond precision to guarantee unique, sortable timestamps.
  const [timestampManuallySet, setTimestampManuallySet] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Wait, AddMeasurementModal calls onAdd(newMeasurement). The slice method `addMeasurement(datasetId, measurementData)` should be used, but let's see how `onAdd` handles it.

    const measurementValues = metrics
      .filter((m) => values[m.id] && !Number.isNaN(Number(values[m.id])))
      .map((m) => ({
        id: generatePbId(),
        metricId: m.id,
        value: Number(values[m.id]),
        created: Date.now(),
        updated: Date.now(),
        measurementId: "", // Will be filled
      }));

    if (measurementValues.length === 0) return;

    const now = Date.now();
    const newMeasurementId = generatePbId();
    measurementValues.forEach((v) => {
      v.measurementId = newMeasurementId;
    });

    const newMeasurement: Measurement = {
      id: newMeasurementId,
      // Use full-precision Date.now() unless user explicitly picked a custom time
      timestamp: timestampManuallySet ? new Date(timestamp).getTime() : now,
      valueIds: measurementValues.map((v) => v.id),
      created: now,
      updated: now,
    };

    // Note: We need to modify onAdd in parent to accept measurement and its values
    onAdd(newMeasurement, measurementValues);
    onClose();
  };

  const handleValueChange = (metricId: string, val: string) => {
    setValues((prev) => ({ ...prev, [metricId]: val }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Record ${dataset.title}`}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {metrics.map((metric) => (
            <div
              key={metric.id}
              className="flex flex-col gap-2 p-4 bg-zinc-900/30 rounded-2xl border border-white/5"
            >
              <label
                htmlFor={`metric-${metric.id}`}
                className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1"
              >
                {metric.name} ({metric.unit.symbol || metric.unit.name})
              </label>
              <input
                id={`metric-${metric.id}`}
                type="number"
                step="any"
                placeholder="0.00"
                className="brutal-input text-xl"
                value={values[metric.id] || ""}
                onChange={(e) => handleValueChange(metric.id, e.target.value)}
              />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="measurement-timestamp"
            className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1"
          >
            Timestamp
          </label>
          <input
            id="measurement-timestamp"
            type="datetime-local"
            required
            className="brutal-input scheme-dark"
            value={timestamp}
            onChange={(e) => {
              setTimestamp(e.target.value);
              setTimestampManuallySet(true);
            }}
          />
        </div>

        <button type="submit" className="mt-4 brutal-btn-brand py-4 w-full">
          Append Log
        </button>
      </form>
    </Modal>
  );
}
