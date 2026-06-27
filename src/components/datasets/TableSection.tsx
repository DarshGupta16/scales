import { useState } from "react";
import { useDatasetStore } from "@/store";
import type { CustomRange, Dataset, Measurement, Timeline } from "../../types/dataset";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { DatasetTable } from "./DatasetTable";

interface TableSectionProps {
  dataset: Dataset;
  measurements?: Measurement[];
  onUpdateDataset: (updatedDataset: Dataset) => void;
  syncWithGraph: boolean;
  onSyncWithGraphChange: (sync: boolean) => void;
  onFilteredMeasurementsChange: (filtered: Measurement[]) => void;
  timeline: Timeline;
  onTimelineChange: (timeline: Timeline) => void;
  customRange: CustomRange;
  onCustomRangeChange: (customRange: CustomRange) => void;
}

export function TableSection({
  dataset,
  measurements,
  syncWithGraph,
  onSyncWithGraphChange,
  onFilteredMeasurementsChange,
  timeline,
  onTimelineChange,
  customRange,
  onCustomRangeChange,
}: TableSectionProps) {
  const { removeMeasurement, removeMeasurements } = useDatasetStore();
  const [confirmDeleteIds, setConfirmDeleteIds] = useState<string[] | null>(null);

  const handleDeleteMeasurements = async (ids: string[]) => {
    if (ids.length === 1) {
      await removeMeasurement(ids[0]);
    } else {
      await removeMeasurements(ids);
    }
    setConfirmDeleteIds(null);
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
        onDelete={(id) => setConfirmDeleteIds([id])}
        onDeleteMultiple={(ids) => setConfirmDeleteIds(ids)}
        syncWithGraph={syncWithGraph}
        onSyncWithGraphChange={onSyncWithGraphChange}
        onFilteredMeasurementsChange={onFilteredMeasurementsChange}
        timeline={timeline}
        onTimelineChange={onTimelineChange}
        customRange={customRange}
        onCustomRangeChange={onCustomRangeChange}
      />

      <ConfirmDialog
        isOpen={!!confirmDeleteIds}
        onClose={() => setConfirmDeleteIds(null)}
        onConfirm={() => confirmDeleteIds && handleDeleteMeasurements(confirmDeleteIds)}
        title={
          confirmDeleteIds && confirmDeleteIds.length > 1 ? "Purge Multiple Entries" : "Purge Entry"
        }
        message={
          confirmDeleteIds && confirmDeleteIds.length > 1
            ? `Are you certain you wish to purge these ${confirmDeleteIds.length} selected data points? This operation permanently modifies the sequence log.`
            : "Are you certain you wish to purge this data point? This operation permanently modifies the sequence log."
        }
        confirmText={
          confirmDeleteIds && confirmDeleteIds.length > 1
            ? `Confirm Purging ${confirmDeleteIds.length}`
            : "Confirm Purge"
        }
        type="danger"
      />
    </section>
  );
}
