import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { mockDatasets } from "../data/mockDatasets";
import { DatasetDetailHeader } from "../components/layout/DatasetDetailHeader";
import { AddMeasurementModal } from "../components/datasets/AddMeasurementModal";
import { GraphSection } from "../components/datasets/GraphSection";
import { TableSection } from "../components/datasets/TableSection";
import { DatasetDetailNotFound } from "../components/datasets/DatasetDetailNotFound";
import type { Dataset, Measurement } from "../types/dataset";

export const Route = createFileRoute("/datasets/$datasetId")({
  component: DatasetDetail,
});

function DatasetDetail() {
  const { datasetId } = Route.useParams();

  // In a real app, this would be managed by TanStack Query
  const [allDatasets, setAllDatasets] = useState(mockDatasets);

  const dataset = useMemo(() => {
    return allDatasets.find((d) => d.id === datasetId);
  }, [allDatasets, datasetId]);

  // Modals state
  const [isAddMeasurementOpen, setIsAddMeasurementOpen] = useState(false);

  if (!dataset) {
    return <DatasetDetailNotFound />;
  }

  const handleUpdateDataset = (updatedDataset: Dataset) => {
    setAllDatasets((prev) =>
      prev.map((d) => (d.id === datasetId ? updatedDataset : d)),
    );
  };

  const handleAddMeasurement = (newMeasurement: Measurement) => {
    handleUpdateDataset({
      ...dataset,
      measurements: [...dataset.measurements, newMeasurement],
    });
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
    </div>
  );
}
