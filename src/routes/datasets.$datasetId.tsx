import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useDatasetStore } from "@/store";
import { AddMeasurementModal } from "../components/datasets/AddMeasurementModal";
import { DatasetDetailNotFound } from "../components/datasets/DatasetDetailNotFound";
import { DatasetSettingsModal } from "../components/datasets/DatasetSettingsModal";
import { GraphSection } from "../components/datasets/GraphSection";
import { TableSection } from "../components/datasets/TableSection";
import { DatasetDetailHeader } from "../components/layout/DatasetDetailHeader";
import { Modal } from "../components/ui/Modal";
import { TimelineSelector } from "../components/ui/TimelineSelector";
import type {
  CustomRange,
  Dataset,
  Measurement,
  Timeline,
} from "../types/dataset";

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

    return dataset.measurements.filter(
      (m) => m.timestamp >= start && m.timestamp <= end,
    );
  }, [dataset, timeline, customRange]);

  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
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

  const timelineLabels: Record<Timeline, string> = {
    all: "Infinity",
    week: "Septenary",
    day: "Circadian",
    custom: "Arbitrary",
  };

  return (
    <div className="min-h-screen bg-[#050505] pb-32 selection:bg-brand selection:text-white relative">
      {/* Subtle Grain Overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] z-100"
        style={{
          backgroundImage:
            'url("https://grainy-gradients.vercel.app/noise.svg")',
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
              <h2 className="text-md sm:text-xl font-display font-bold text-white uppercase tracking-tight">
                Temporal Window
              </h2>
              {/* Mobile Timeline Toggle */}
              <button
                type="button"
                onClick={() => setIsTimelineOpen(true)}
                className="sm:hidden flex items-center gap-3 px-5 py-2.5 bg-zinc-950 border border-white/10 rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.05)] active:scale-95 transition-all group"
              >
                <div className="flex flex-col items-center gap-0.3 w-24">
                  <span className="text-[6.3px] font-bold text-zinc-600 uppercase tracking-[0.4em]">
                    Temporal Status
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse shadow-[0_0_8px_rgba(139,92,246,0.5)]"></div>
                    <span className="text-[10px] font-bold text-white uppercase tracking-[0.2em] group-active:text-brand transition-colors">
                      {timelineLabels[timeline]}
                    </span>
                  </div>
                </div>
              </button>
            </div>
            <div className="hidden sm:block">
              <TimelineSelector
                activeTimeline={timeline}
                onTimelineChange={setTimeline}
                customRange={customRange}
                onCustomRangeChange={setCustomRange}
              />
            </div>
          </div>

          <Modal
            isOpen={isTimelineOpen}
            onClose={() => setIsTimelineOpen(false)}
            title="Temporal Adjustment"
          >
            <div className="flex flex-col gap-8">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] leading-relaxed">
                Select the temporal resolution for data visualization.
              </p>
              <TimelineSelector
                activeTimeline={timeline}
                onTimelineChange={(t) => {
                  setTimeline(t);
                  if (t !== "custom") setIsTimelineOpen(false);
                }}
                customRange={customRange}
                onCustomRangeChange={setCustomRange}
              />
              {timeline === "custom" && (
                <button
                  type="button"
                  onClick={() => setIsTimelineOpen(false)}
                  className="w-full py-4 bg-brand text-white font-bold uppercase tracking-[0.2em] text-[10px] rounded-2xl shadow-lg shadow-brand/20 active:scale-95 transition-all"
                >
                  Confirm Parameters
                </button>
              )}
            </div>
          </Modal>

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
