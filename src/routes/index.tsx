import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { TopBar } from "../components/TopBar";
import { DatasetGrid } from "../components/DatasetGrid";
import { AddDatasetFAB } from "../components/AddDatasetFAB";
import { AddDatasetModal } from "../components/AddDatasetModal";
import type { Dataset } from "../types/dataset";
import { useTRPC, trpc } from "../trpc/client";
import { useRouter } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { dexieDb } from "../dexieDb";

export const Route = createFileRoute("/")({
  component: Index,
  loader: async ({ context: { queryClient } }) => {
    // We intentionally ignore the server fetching block to ensure the shell loads instantly
    // We will initiate the query client fetch but not block on it.
    queryClient.ensureQueryData({
      ...trpc.getDatasets.queryOptions(),
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
    });
    return undefined;
  },
});

function Index() {
  const router = useRouter();

  // 1. Get instantaneous offline data from Dexie
  const localDatasets = useLiveQuery(() => dexieDb.datasets.toArray()) || [];

  // 2. Background sync with server
  const trpcClient = useTRPC();
  const { data: serverDatasets } = useQuery({
    ...trpcClient.getDatasets.queryOptions(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  // 3. Sync Server Data -> Local Dexie DB
  // When network brings fresh data, wipe the local table and replace it.
  // We wipe first because we're using auto-increment `++index` instead of `id` for primary keys.
  useEffect(() => {
    if (serverDatasets && serverDatasets.length > 0) {
      const syncToDexie = async () => {
        await dexieDb.datasets.clear();
        await dexieDb.datasets.bulkAdd(serverDatasets);
      };
      syncToDexie();
    }
  }, [serverDatasets]);

  // Preload routes using whatever data is currently available (local or server)
  const activeDatasets = serverDatasets || localDatasets;

  useEffect(() => {
    const preloadRoutes = async () => {
      for (const dataset of activeDatasets) {
        router.preloadRoute({
          to: "/datasets/$datasetId",
          params: { datasetId: dataset.slug },
        });
      }
    };
    if (activeDatasets.length > 0) preloadRoutes();
  }, [activeDatasets, router]);

  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const filteredDatasets = useMemo(() => {
    return (activeDatasets || []).filter(
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
        onDatasetCreated={() => {}}
      />
    </div>
  );
}
