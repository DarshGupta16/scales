import { useState } from "react";
import { DatasetTable } from "./DatasetTable";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import type { Dataset } from "../../types/dataset";

interface TableSectionProps {
  dataset: Dataset;
  onUpdateDataset: (updatedDataset: Dataset) => void;
}

export function TableSection({ dataset, onUpdateDataset }: TableSectionProps) {
  const [confirmDeleteMeasurement, setConfirmDeleteMeasurement] = useState<
    string | null
  >(null);

  const handleDeleteMeasurement = (id: string) => {
    onUpdateDataset({
      ...dataset,
      measurements: dataset.measurements.filter((m) => m.id !== id),
    });
    setConfirmDeleteMeasurement(null);
  };

  return (
    <section className="flex flex-col gap-10">
      <div className="flex items-center justify-between border-l-2 border-brand/50 pl-6">
        <h2 className="text-xl font-display font-bold text-white uppercase tracking-tight">
          Sequence Log
        </h2>
        <span className="text-[10px] font-bold font-sans text-zinc-500 uppercase tracking-[0.3em] px-4 py-2 bg-white/5 rounded-full border border-white/5">
          Entries: {dataset.measurements.length}
        </span>
      </div>

      <DatasetTable
        measurements={dataset.measurements}
        unit={dataset.unit}
        onDelete={setConfirmDeleteMeasurement}
      />

      <ConfirmDialog
        isOpen={!!confirmDeleteMeasurement}
        onClose={() => setConfirmDeleteMeasurement(null)}
        onConfirm={() =>
          confirmDeleteMeasurement &&
          handleDeleteMeasurement(confirmDeleteMeasurement)
        }
        title="Purge Entry"
        message="Are you certain you wish to purge this data point? This operation permanently modifies the sequence log."
        confirmText="Confirm Purge"
        type="danger"
      />
    </section>
  );
}
