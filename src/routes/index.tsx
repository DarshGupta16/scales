import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { mockDatasets } from "../data/mockDatasets";
import { TopBar } from "../components/TopBar";
import { DatasetGrid } from "../components/DatasetGrid";
import { AddDatasetFAB } from "../components/AddDatasetFAB";
import { AddDatasetModal } from "../components/AddDatasetModal";
import type { Dataset } from "../types/dataset";
import { useTRPC } from "../trpc/client";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [datasets, setDatasets] = useState<Dataset[]>(mockDatasets);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // tRPC state
  const trpc = useTRPC();
  const getDatasets = useQuery(trpc.getDatasets.queryOptions());

  useEffect(() => {
    if (getDatasets.isFetched) {
      const datasets: Dataset[] = getDatasets.data as Dataset[];
      console.log(datasets);
      setDatasets(datasets);
    }
  }, [getDatasets]);

  const filteredDatasets = useMemo(() => {
    return datasets.filter(
      (dataset) =>
        dataset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dataset.unit.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [datasets, searchQuery]);

  const handleDatasetCreated = (newDataset: Dataset) => {
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

      <TopBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      <DatasetGrid datasets={filteredDatasets} />

      <AddDatasetFAB onClick={() => setIsAddModalOpen(true)} />

      <AddDatasetModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onDatasetCreated={handleDatasetCreated}
      />
    </div>
  );
}
