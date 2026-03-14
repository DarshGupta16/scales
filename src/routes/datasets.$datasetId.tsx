import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { DatasetDetailHeader } from "../components/layout/DatasetDetailHeader";
import { AddMeasurementModal } from "../components/datasets/AddMeasurementModal";
import { DatasetSettingsModal } from "../components/datasets/DatasetSettingsModal";
import { GraphSection } from "../components/datasets/GraphSection";
import { TableSection } from "../components/datasets/TableSection";
import { DatasetDetailNotFound } from "../components/datasets/DatasetDetailNotFound";
import type { Dataset, Measurement } from "../types/dataset";
import { useDatasetStore } from "@/store";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/datasets/$datasetId")({
  component: DatasetDetail,
});

function DatasetDetail() {
  const { datasetId } = Route.useParams();
  const { datasets, updateDataset, removeDataset } = useDatasetStore();

  const dataset = useMemo(() => {
    return datasets.find((d) => d.id === datasetId);
  }, [datasets, datasetId]);

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
    const updatedDataset = {
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
          backgroundImage:
            'url("https://grainy-gradients.vercel.app/noise.svg")',
        }}
      ></div>

      <DatasetDetailHeader
        title={dataset.title}
        unit={dataset.unit}
        onAddMeasurement={() => setIsAddMeasurementOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-0">
        <div className="grid grid-cols-1 gap-20">
          <GraphSection
            dataset={dataset}
            onUpdateDataset={handleUpdateDataset}
          />

          <TableSection
            dataset={dataset}
            onUpdateDataset={handleUpdateDataset}
          />
        </div>
      </main>

      <AddMeasurementModal
        isOpen={isAddMeasurementOpen}
        onClose={() => setIsAddMeasurementOpen(false)}
        onAdd={handleAddMeasurement}
        unit={dataset.unit}
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
