import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { mockDatasets } from "../data/mockDatasets";
import { TopBar } from "../components/layout/TopBar";
import { DatasetGrid } from "../components/datasets/DatasetGrid";
import { AddDatasetFAB } from "../components/layout/AddDatasetFAB";
import { AddDatasetModal } from "../components/datasets/AddDatasetModal";
import type { Dataset } from "../types/dataset";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [datasets, setDatasets] = useState<Dataset[]>(mockDatasets);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Core data filtering logic remains in the orchestrator
  const filteredDatasets = useMemo(() => {
    return datasets.filter(
      (dataset) =>
        dataset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dataset.unit.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [datasets, searchQuery]);

  const handleAddDataset = (newDataset: Dataset) => {
    setDatasets([newDataset, ...datasets]);
  };

  return (
    <div className="min-h-screen pb-24 bg-[#050505] relative selection:bg-brand selection:text-white">
      {/* Subtle Grain Overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] z-[100]"
        style={{
          backgroundImage:
            'url("https://grainy-gradients.vercel.app/noise.svg")',
        }}
      ></div>

      <TopBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <DatasetGrid datasets={filteredDatasets} />

      <AddDatasetFAB onClick={() => setIsAddModalOpen(true)} />

      <AddDatasetModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddDataset}
      />
    </div>
  );
}
