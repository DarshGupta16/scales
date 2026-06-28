import { useState } from "react";
import { useTemporalFilter } from "../../hooks/useTemporalFilter";
import type { Dataset, Measurement, Timeline } from "../../types/dataset";
import { AppLayout } from "../layout/AppLayout";
import { DatasetDetailHeader } from "../layout/DatasetDetailHeader";
import { Modal } from "../ui/Modal";
import { TimelineSelector } from "../ui/TimelineSelector";
import { AddMeasurementModal } from "./AddMeasurementModal";
import { DatasetSettingsModal } from "./DatasetSettingsModal";
import { GraphSection } from "./GraphSection";
import { TableSection } from "./TableSection";

interface DatasetDetailViewProps {
  dataset: Dataset;
  onUpdateDataset: (dataset: Dataset) => void;
  onDeleteDataset: (id: string) => void;
  onAddMeasurement: (measurement: Measurement) => void;
}

export function DatasetDetailView({
  dataset,
  onUpdateDataset,
  onDeleteDataset,
  onAddMeasurement,
}: DatasetDetailViewProps) {
  const { timeline, setTimeline, customRange, setCustomRange, filteredMeasurements } =
    useTemporalFilter(dataset?.measurements || []);

  const [syncWithGraph, setSyncWithGraph] = useState(true);
  const [tableFilteredMeasurements, setTableFilteredMeasurements] = useState<Measurement[] | null>(
    null,
  );

  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [isAddMeasurementOpen, setIsAddMeasurementOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleAddMeasurement = (newMeasurement: Measurement) => {
    onAddMeasurement(newMeasurement);
    setIsAddMeasurementOpen(false);
  };

  const timelineLabels: Record<Timeline, string> = {
    all: "Infinity",
    week: "Septenary",
    day: "Circadian",
    custom: "Arbitrary",
  };

  const graphMeasurements =
    syncWithGraph && tableFilteredMeasurements ? tableFilteredMeasurements : filteredMeasurements;

  return (
    <AppLayout className="pb-32">
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
            measurements={graphMeasurements}
            onUpdateDataset={onUpdateDataset}
          />

          <TableSection
            dataset={dataset}
            measurements={filteredMeasurements}
            onUpdateDataset={onUpdateDataset}
            syncWithGraph={syncWithGraph}
            onSyncWithGraphChange={setSyncWithGraph}
            onFilteredMeasurementsChange={setTableFilteredMeasurements}
            timeline={timeline}
            onTimelineChange={setTimeline}
            customRange={customRange}
            onCustomRangeChange={setCustomRange}
          />
        </div>
      </main>

      {isAddMeasurementOpen && (
        <AddMeasurementModal
          isOpen={isAddMeasurementOpen}
          onClose={() => setIsAddMeasurementOpen(false)}
          onAdd={handleAddMeasurement}
          dataset={dataset}
        />
      )}

      {isSettingsOpen && (
        <DatasetSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          dataset={dataset}
          onUpdate={onUpdateDataset}
          onDelete={onDeleteDataset}
        />
      )}
    </AppLayout>
  );
}
