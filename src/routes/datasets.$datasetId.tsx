import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import type { ViewType } from "../types/dataset";
import { useData } from "../hooks/useData";
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
    params: { datasetId },
  }) => {
    await queryClient.ensureQueryData({
      ...trpc.getDataset.queryOptions(datasetId),
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
  const { dataset, removeMeasurement } = useData(datasetId);

  const [activeView, setActiveView] = useState<ViewType | null>(null);

  // Set initial active view once dataset is loaded
  useEffect(() => {
    if (dataset && !activeView) {
      setActiveView(dataset.views[0] ?? "line");
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

  const handleDeleteMeasurement = (id: string) => {
    void removeMeasurement(id);
  };

  const handleAddView = (view: ViewType) => {
    if (!dataset || dataset.views.includes(view)) return;

    setActiveView(view);
    setIsAddViewOpen(false);
  };

  const handleRemoveView = (view: ViewType) => {
    const updatedViews = dataset.views.filter((v) => v !== view);
    if (activeView === view) {
      setActiveView(updatedViews[0] ?? null);
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
