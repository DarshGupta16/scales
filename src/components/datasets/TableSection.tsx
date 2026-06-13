import { useState } from "react";
import { useDatasetStore } from "@/store";
import type { Dataset, Measurement } from "../../types/dataset";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { DatasetTable } from "./DatasetTable";

interface TableSectionProps {
  dataset: Dataset;
  measurements?: Measurement[];
  onUpdateDataset: (updatedDataset: Dataset) => void;
}

export function TableSection({ dataset, measurements }: TableSectionProps) {
  const { removeMeasurement } = useDatasetStore();
  const [confirmDeleteMeasurement, setConfirmDeleteMeasurement] = useState<string | null>(null);

  const handleDeleteMeasurement = (id: string) => {
    removeMeasurement(id);
    setConfirmDeleteMeasurement(null);
  };

  const displayMeasurements = measurements || dataset.measurements || [];

  return (
    <section className="flex flex-col gap-10">
      <div className="flex items-center justify-between border-l-2 border-brand/50 pl-6">
        <h2 className="text-xl font-display font-bold text-white uppercase tracking-tight">
          Sequence Log
        </h2>
        <span className="text-[10px] font-bold font-sans text-zinc-500 uppercase tracking-[0.3em] px-4 py-2 bg-white/5 rounded-full border border-white/5">
          Entries: {displayMeasurements.length}
        </span>
      </div>

      <DatasetTable
        dataset={dataset}
        measurements={displayMeasurements}
        onDelete={setConfirmDeleteMeasurement}
      />

      <ConfirmDialog
        isOpen={!!confirmDeleteMeasurement}
        onClose={() => setConfirmDeleteMeasurement(null)}
        onConfirm={() =>
          confirmDeleteMeasurement && handleDeleteMeasurement(confirmDeleteMeasurement)
        }
        title="Purge Entry"
        message="Are you certain you wish to purge this data point? This operation permanently modifies the sequence log."
        confirmText="Confirm Purge"
        type="danger"
      />
    </section>
  );
}
