import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import type { ViewType, Measurement } from "../types/dataset";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "../trpc/client";

// Sub-components
import { DatasetDetailNotFound } from "../components/dataset-detail/DatasetDetailNotFound";
import { DatasetDetailHeader } from "../components/dataset-detail/DatasetDetailHeader";
import { GraphSection } from "../components/dataset-detail/GraphSection";
import { TableSection } from "../components/dataset-detail/TableSection";
import { AddMeasurementModal } from "../components/dataset-detail/AddMeasurementModal";
import { AddViewModal } from "../components/dataset-detail/AddViewModal";

export const Route = createFileRoute("/datasets/$datasetId")({
  component: DatasetDetail,
  loader: async ({
    context: { queryClient },
    params: { datasetId: _datasetId },
  }) => {
    await queryClient.ensureQueryData({
      ...trpc.getDatasets.queryOptions(),
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
    });
  },
});

function DatasetDetail() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { datasetId } = Route.useParams();
  const queryClient = useQueryClient();

  // Fetch data using TanStack Query + tRPC
  const { data: datasets } = useQuery({
    ...trpc.getDatasets.queryOptions(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  const dataset = useMemo(() => {
    return (datasets || []).find((d) => d.slug === datasetId);
  }, [datasets, datasetId]);

  const upsertMutation = useMutation(
    trpc.upsertDataset.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.getDatasets.queryOptions());
      },
    }),
  );

  const [activeView, setActiveView] = useState<ViewType | null>(null);

  // Set initial active view once dataset is loaded
  useEffect(() => {
    if (dataset && !activeView) {
      setActiveView(dataset.views[0] || "line");
    }
  }, [dataset, activeView]);

  // Modals state
  const [isAddMeasurementOpen, setIsAddMeasurementOpen] = useState(false);
  const [isAddViewOpen, setIsAddViewOpen] = useState(false);
  const [confirmDeleteMeasurement, setConfirmDeleteMeasurement] = useState<
    string | null
  >(null);
  const [confirmRemoveView, setConfirmRemoveView] = useState<ViewType | null>(
    null,
  );

  if (!isMounted) {
    return null;
  }

  if (!dataset) {
    return <DatasetDetailNotFound />;
  }

  // const handleAddMeasurement = (value: number, timestamp: string) => {
  //   if (!dataset) return;

  //   const newMeasurement: Measurement = {
  //     id: Math.random().toString(36).substring(7),
  //     timestamp,
  //     value,
  //   };

  //   upsertMutation.mutate({
  //     ...dataset,
  //     measurements: [...dataset.measurements, newMeasurement],
  //   });
  // };

  const handleDeleteMeasurement = (id: string) => {
    if (!dataset) return;
    upsertMutation.mutate({
      ...dataset,
      measurements: dataset.measurements.filter((m) => m.id !== id),
    });
  };

  const handleAddView = (view: ViewType) => {
    if (!dataset || dataset.views.includes(view)) return;

    upsertMutation.mutate({
      ...dataset,
      views: [...dataset.views, view],
    });
    setActiveView(view);
    setIsAddViewOpen(false);
  };

  const handleRemoveView = (view: ViewType) => {
    if (!dataset) return;
    const updatedViews = dataset.views.filter((v) => v !== view);
    upsertMutation.mutate({
      ...dataset,
      views: updatedViews,
    });
    if (activeView === view) {
      setActiveView(updatedViews[0] || null);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] pb-32 selection:bg-brand selection:text-white relative">
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] z-[100]"
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
            measurements={dataset.measurements}
            unit={dataset.unit}
            views={dataset.views}
            activeView={activeView}
            onViewChange={setActiveView}
            onAddView={() => setIsAddViewOpen(true)}
            onRemoveView={setConfirmRemoveView}
          />

          <TableSection
            measurements={dataset.measurements}
            unit={dataset.unit}
            onDeleteMeasurement={setConfirmDeleteMeasurement}
          />
        </div>
      </main>

      <AddMeasurementModal
        isOpen={isAddMeasurementOpen}
        onClose={() => setIsAddMeasurementOpen(false)}
        // onAdd={handleAddMeasurement}
        unit={dataset.unit}
        datasetSlug={dataset.slug}
      />

      <AddViewModal
        isOpen={isAddViewOpen}
        onClose={() => setIsAddViewOpen(false)}
        onAddView={handleAddView}
        existingViews={dataset.views}
      />

      <ConfirmDialog
        isOpen={!!confirmDeleteMeasurement}
        onClose={() => setConfirmDeleteMeasurement(null)}
        onConfirm={() =>
          confirmDeleteMeasurement &&
          handleDeleteMeasurement(confirmDeleteMeasurement)
        }
        title="Purge Entry"
        message="Are you certain you wish to purge this data point? This operation permanently modifies the sequence log."
        confirmText="Confirm Purge"
        type="danger"
      />

      <ConfirmDialog
        isOpen={!!confirmRemoveView}
        onClose={() => setConfirmRemoveView(null)}
        onConfirm={() =>
          confirmRemoveView && handleRemoveView(confirmRemoveView)
        }
        title="Deactivate Module"
        message={`Confirm deactivation of the ${confirmRemoveView?.toUpperCase()} renderer from this dataset.`}
        confirmText="Deactivate"
        type="danger"
      />
    </div>
  );
}
