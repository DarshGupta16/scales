import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { TopBar } from "../components/TopBar";
import { DatasetGrid } from "../components/DatasetGrid";
import { AddDatasetFAB } from "../components/AddDatasetFAB";
import { AddDatasetModal } from "../components/AddDatasetModal";
import { useRouter } from "@tanstack/react-router";
import { trpc } from "../trpc/client";
import { checkLocalReady } from "../utils/ssr-skip";
import { useDatasets } from "../hooks/useDatasets";

export const Route = createFileRoute("/")({
  component: Index,
  loader: async ({ context: { queryClient } }) => {
    const isLocalReady = await checkLocalReady();
    if (isLocalReady) {
      return [];
    }

    return await queryClient.ensureQueryData({
      ...trpc.getDatasets.queryOptions(),
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
    });
  },
});

function Index() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Get data synchronously from the loader
  const initialDatasets = Route.useLoaderData();

  // Unified Reactive Data Hook
  const { datasets } = useDatasets(initialDatasets);

  useEffect(() => {
    const preloadRoutes = async () => {
      if (!datasets) return;
      for (const dataset of datasets) {
        router.preloadRoute({
          to: "/datasets/$datasetId",
          params: { datasetId: dataset.slug },
        });
      }
    };

    preloadRoutes();
  }, [datasets]);

  const filteredDatasets = useMemo(() => {
    return (datasets || []).filter(
      (dataset) =>
        dataset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dataset.unit.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [datasets, searchQuery]);

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
        onDatasetCreated={() => {}}
      />
    </div>
  );
}
