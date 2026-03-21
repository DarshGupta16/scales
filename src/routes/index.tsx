import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useDatasetStore } from "@/store";
import { DatasetView } from "../components/datasets/DatasetView";
import { DatasetSettingsModal } from "../components/datasets/DatasetSettingsModal";
import { AddDatasetFAB } from "../components/layout/AddDatasetFAB";
import { TopBar } from "../components/layout/TopBar";
import type { Dataset } from "../types/dataset";


export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { datasets, updateDataset, removeDataset } = useDatasetStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [editingDataset, setEditingDataset] = useState<Dataset | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Core data filtering logic - datasets are already hydrated by the store
  const filteredDatasets = useMemo(() => {
    return (datasets || [])
      .filter(
        (d) =>
          d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.unit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.unit.symbol.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      .sort((a, b) => (a.created || 0) - (b.created || 0));
  }, [datasets, searchQuery]);

  const handleUpdateDataset = (updatedDataset: Dataset) => {
    updateDataset(updatedDataset);
    setEditingDataset(null);
    setIsDeleting(false);
  };

  const handleDeleteDataset = (id: string) => {
    removeDataset(id);
    setEditingDataset(null);
    setIsDeleting(false);
  };

  return (
    <div className="min-h-screen pb-24 bg-[#050505] relative selection:bg-brand selection:text-white">
      {/* Subtle Grain Overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] z-100"
        style={{
          backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")',
        }}
      ></div>

      <TopBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <DatasetView
        datasets={filteredDatasets as Dataset[]}
        onEdit={(dataset) => {
          setEditingDataset(dataset);
          setIsDeleting(false);
        }}
        onDelete={(dataset) => {
          setEditingDataset(dataset);
          setIsDeleting(true);
        }}
      />

      <AddDatasetFAB />

      {editingDataset && (
        <DatasetSettingsModal
          isOpen={!!editingDataset}
          onClose={() => {
            setEditingDataset(null);
            setIsDeleting(false);
          }}
          dataset={editingDataset}
          onUpdate={handleUpdateDataset}
          onDelete={handleDeleteDataset}
          showDeleteDirectly={isDeleting}
        />
      )}
    </div>
  );
}
