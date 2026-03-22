import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useDatasetStore } from "@/store";
import { AddMeasurementModal } from "../components/datasets/AddMeasurementModal";
import { DatasetDetailNotFound } from "../components/datasets/DatasetDetailNotFound";
import { DatasetSettingsModal } from "../components/datasets/DatasetSettingsModal";
import { GraphSection } from "../components/datasets/GraphSection";
import { TableSection } from "../components/datasets/TableSection";
import { DatasetDetailHeader } from "../components/layout/DatasetDetailHeader";
import { TimelineSelector } from "../components/ui/TimelineSelector";
import type { CustomRange, Dataset, Measurement, Timeline } from "../types/dataset";

export const Route = createFileRoute("/datasets/$datasetId")({
  component: DatasetDetail,
});

function DatasetDetail() {
  const { datasetId } = Route.useParams();
  const { datasets, updateDataset, removeDataset } = useDatasetStore();

  const dataset = useMemo(() => {
    return datasets.find((d) => d.id === datasetId);
  }, [datasets, datasetId]);

  // Timeline state
  const [timeline, setTimeline] = useState<Timeline>("all");
  const [customRange, setCustomRange] = useState<CustomRange>({
    start: Date.now() - 24 * 60 * 60 * 1000,
    end: Date.now(),
  });

  const filteredMeasurements = useMemo(() => {
    if (!dataset) return [];
    const now = Date.now();
    let start = 0;
    let end = Infinity;

    switch (timeline) {
      case "day":
        start = now - 24 * 60 * 60 * 1000;
        break;
      case "week":
        start = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case "custom":
        start = customRange.start;
        end = customRange.end;
        break;
      default:
        return dataset.measurements;
    }

    return dataset.measurements.filter((m) => m.timestamp >= start && m.timestamp <= end);
  }, [dataset, timeline, customRange]);

  // Modals state
  const [isAddMeasurementOpen, setIsAddMeasurementOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const navigate = useNavigate();

  if (!dataset) {
    return <DatasetDetailNotFound />;
  }

  const handleUpdateDataset = (updatedDataset: Dataset) => {
    updateDataset(updatedDataset);
  };

  const handleDeleteDataset = (id: string) => {
    removeDataset(id);
    navigate({ to: "/" });
  };

  const handleAddMeasurement = (newMeasurement: Measurement) => {
    const updatedDataset: Dataset = {
      ...dataset,
      measurements: [...dataset.measurements, newMeasurement],
    };
    updateDataset(updatedDataset);
    setIsAddMeasurementOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] pb-32 selection:bg-brand selection:text-white relative">
      {/* Subtle Grain Overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] z-100"
        style={{
          backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")',
        }}
      ></div>

      <DatasetDetailHeader
        title={dataset.title}
        unit={dataset.unit.symbol || dataset.unit.name}
        onAddMeasurement={() => setIsAddMeasurementOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-0">
        <div className="flex flex-col gap-14">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-l-2 border-brand/50 pl-6">
              <h2 className="text-xl font-display font-bold text-white uppercase tracking-tight">
                Temporal Window
              </h2>
            </div>
            <TimelineSelector
              activeTimeline={timeline}
              onTimelineChange={setTimeline}
              customRange={customRange}
              onCustomRangeChange={setCustomRange}
            />
          </div>

          <GraphSection
            dataset={dataset}
            measurements={filteredMeasurements}
            onUpdateDataset={handleUpdateDataset}
          />

          <TableSection
            dataset={dataset}
            measurements={filteredMeasurements}
            onUpdateDataset={handleUpdateDataset}
          />
        </div>
      </main>

      <AddMeasurementModal
        isOpen={isAddMeasurementOpen}
        onClose={() => setIsAddMeasurementOpen(false)}
        onAdd={handleAddMeasurement}
        unit={dataset.unit.symbol || dataset.unit.name}
      />

      <DatasetSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        dataset={dataset}
        onUpdate={handleUpdateDataset}
        onDelete={handleDeleteDataset}
      />
    </div>
  );
}
