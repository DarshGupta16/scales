import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useDatasetStore } from "@/store";
import { DatasetSettingsModal } from "../components/datasets/DatasetSettingsModal";
import { DatasetView } from "../components/datasets/DatasetView";
import { AddDatasetFAB } from "../components/layout/AddDatasetFAB";
import { AppLayout } from "../components/layout/AppLayout";
import { TopBar } from "../components/layout/TopBar";
import { useDatasetSearch } from "../hooks/useDatasetSearch";
import type { Dataset } from "../types/dataset";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const datasets = useDatasetStore(
    useShallow((state) => state.datasetIds.map((id) => state.datasetsById[id])),
  );
  const updateDataset = useDatasetStore((state) => state.updateDataset);
  const removeDataset = useDatasetStore((state) => state.removeDataset);

  const { searchQuery, setSearchQuery, filteredDatasets } = useDatasetSearch(datasets);
  const [editingDataset, setEditingDataset] = useState<Dataset | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
    <AppLayout className="pb-24">
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
    </AppLayout>
  );
}
