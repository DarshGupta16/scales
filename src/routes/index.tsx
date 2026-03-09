import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { TopBar } from "../components/TopBar";
import { DatasetGrid } from "../components/DatasetGrid";
import { AddDatasetFAB } from "../components/AddDatasetFAB";
import { AddDatasetModal } from "../components/AddDatasetModal";
import type { Dataset } from "../types/dataset";
import { useDatasetCollection } from "@/hooks/useDatasets";
import { trpc } from "../trpc/client";

export const Route = createFileRoute("/")({
  component: Index,
  loader: ({ context: { queryClient } }) => {
    // We initiate the query client fetch but don't block on it to ensure instant shell loading.
    void queryClient.ensureQueryData({
      ...trpc.getDatasets.queryOptions(),
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
    });
    return undefined;
  },
});

function Index() {
  const router = useRouter();

  // Background sync and local fallback are handled inside the central hook.
  const { datasets: activeDatasets } = useDatasetCollection();

  // Preload routes using whatever data is currently available.
  useEffect(() => {
    const preloadRoutes = () => {
      void router.preloadRoute({ to: "/logs" });
      if (activeDatasets && activeDatasets.length > 0) {
        for (const dataset of activeDatasets) {
          void router.preloadRoute({
            to: "/datasets/$datasetId",
            params: { datasetId: dataset.slug },
          });
        }
      }
    };

    preloadRoutes();
  }, [activeDatasets, router]);

  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const filteredDatasets = useMemo(() => {
    return (activeDatasets ?? []).filter(
      (dataset: Dataset) =>
        dataset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dataset.unit.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [activeDatasets, searchQuery]);

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
        onDatasetCreated={() => {
          // Log dataset creation success if needed
        }}
      />
    </div>
  );
}
