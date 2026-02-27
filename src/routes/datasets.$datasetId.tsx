import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { DatasetGraph } from "../components/DatasetGraph";
import { ViewSwitcher } from "../components/ViewSwitcher";
import { DatasetTable } from "../components/DatasetTable";
import { Modal } from "../components/Modal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ArrowLeft, Plus } from "lucide-react";
import type { ViewType, Measurement } from "../types/dataset";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "../trpc/client";

export const Route = createFileRoute("/datasets/$datasetId")({
  component: DatasetDetail,
  loader: async ({ context: { queryClient }, params: { datasetId: _datasetId } }) => {
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

  const upsertMutation = useMutation(trpc.upsertDataset.mutationOptions({
    onSuccess: () => {
      queryClient.invalidateQueries(trpc.getDatasets.queryOptions());
    }
  }));

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

  // Form states
  const [newValue, setNewValue] = useState("");
  const [newTimestamp, setNewTimestamp] = useState(
    new Date().toISOString().slice(0, 16),
  );

  if (!isMounted) {
    return null;
  }

  if (!dataset) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-[#050505] selection:bg-brand selection:text-white relative">
        <div className="bg-[#0a0a0a] p-16 border border-white/10 rounded-[3rem] shadow-2xl relative z-10">
          <h1 className="text-5xl font-display font-extrabold text-white mb-6 uppercase tracking-tighter">
            Records
            <br />
            <span className="text-red-500">Absent</span>
          </h1>
          <p className="text-zinc-500 font-sans uppercase tracking-[0.2em] mb-10 border-l-2 border-red-500/50 pl-6 text-left text-xs">
            The requested entity has been purged or never existed.
          </p>
          <Link
            to="/"
            className="inline-block brutal-btn-brand w-full text-center"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  const handleAddMeasurement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue || isNaN(Number(newValue)) || !dataset) return;

    const newMeasurement: Measurement = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date(newTimestamp).toISOString(),
      value: Number(newValue),
    };

    upsertMutation.mutate({
      ...dataset,
      measurements: [...dataset.measurements, newMeasurement]
    });

    setIsAddMeasurementOpen(false);
    setNewValue("");
  };

  const handleDeleteMeasurement = (id: string) => {
    if (!dataset) return;
    upsertMutation.mutate({
      ...dataset,
      measurements: dataset.measurements.filter((m) => m.id !== id)
    });
  };

  const handleAddView = (view: ViewType) => {
    if (!dataset || dataset.views.includes(view)) return;

    upsertMutation.mutate({
      ...dataset,
      views: [...dataset.views, view]
    });
    setActiveView(view);
    setIsAddViewOpen(false);
  };

  const handleRemoveView = (view: ViewType) => {
    if (!dataset) return;
    const updatedViews = dataset.views.filter((v) => v !== view);
    upsertMutation.mutate({
      ...dataset,
      views: updatedViews
    });
    if (activeView === view) {
      setActiveView(updatedViews[0] || null);
    }
  };

  const availableViewTypes: ViewType[] = [
    "line",
    "bar",
    "area",
    "pie",
    "scatter",
  ];

  return (
    <div className="min-h-screen bg-[#050505] pb-32 selection:bg-brand selection:text-white relative">
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] z-[100]"
        style={{
          backgroundImage:
            'url("https://grainy-gradients.vercel.app/noise.svg")',
        }}
      ></div>

      {/* Detail Header */}
      <header className="bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 relative z-50 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="p-3 text-zinc-400 border border-white/10 hover:border-brand/50 hover:text-white hover:bg-white/5 transition-all rounded-xl"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-white uppercase tracking-tight">
                {dataset.title}
              </h1>
              <p className="text-[10px] font-sans font-bold text-brand uppercase tracking-[0.4em] mt-2 ml-1">
                {dataset.unit}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAddMeasurementOpen(true)}
            className="hidden sm:flex items-center gap-3 px-6 py-3 bg-brand text-white font-bold uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-brand/20 hover:brightness-110 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Inject Data</span>
          </button>

          <button
            onClick={() => setIsAddMeasurementOpen(true)}
            className="sm:hidden flex items-center justify-center w-12 h-12 bg-brand text-white rounded-xl shadow-lg shadow-brand/20 active:scale-95"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-0">
        <div className="grid grid-cols-1 gap-20">
          {/* Graph Section */}
          <section className="flex flex-col gap-8">
            <div className="bg-[#0a0a0a] p-8 sm:p-12 border border-white/5 rounded-[3rem] shadow-2xl min-h-[550px] flex flex-col">
              <div className="flex flex-wrap items-center justify-between gap-8 mb-12 border-b border-white/5 pb-8">
                <h2 className="text-xl font-display font-bold text-white uppercase tracking-tight flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-brand animate-pulse"></div>
                  Neural Matrix
                </h2>
                <ViewSwitcher
                  views={dataset.views}
                  activeView={activeView || "line"}
                  onViewChange={setActiveView}
                  onAddView={() => setIsAddViewOpen(true)}
                  onRemoveView={setConfirmRemoveView}
                />
              </div>

              <div className="flex-1 min-h-0 bg-black/40 rounded-3xl overflow-hidden border border-white/5">
                {activeView ? (
                  <DatasetGraph
                    data={dataset.measurements}
                    viewType={activeView}
                    unit={dataset.unit}
                  />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-700 font-sans uppercase tracking-[0.3em] font-bold text-xs">
                    [ SYSTEM STANDBY. SELECT MODULE. ]
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Table Section */}
          <section className="flex flex-col gap-10">
            <div className="flex items-center justify-between border-l-2 border-brand/50 pl-6">
              <h2 className="text-xl font-display font-bold text-white uppercase tracking-tight">
                Sequence Log
              </h2>
              <span className="text-[10px] font-bold font-sans text-zinc-500 uppercase tracking-[0.3em] px-4 py-2 bg-white/5 rounded-full border border-white/5">
                Entries: {dataset.measurements.length}
              </span>
            </div>
            <DatasetTable
              measurements={dataset.measurements}
              unit={dataset.unit}
              onDelete={setConfirmDeleteMeasurement}
            />
          </section>
        </div>
      </main>

      {/* Modals */}
      <Modal
        isOpen={isAddMeasurementOpen}
        onClose={() => setIsAddMeasurementOpen(false)}
        title="Record Measurement"
      >
        <form onSubmit={handleAddMeasurement} className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1">
              Magnitude ({dataset.unit})
            </label>
            <input
              autoFocus
              type="number"
              step="any"
              required
              placeholder="0.00"
              className="brutal-input text-2xl"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1">
              Timestamp
            </label>
            <input
              type="datetime-local"
              required
              className="brutal-input [color-scheme:dark]"
              value={newTimestamp}
              onChange={(e) => setNewTimestamp(e.target.value)}
            />
          </div>
          <button type="submit" className="mt-4 brutal-btn-brand py-4 w-full">
            Append Log
          </button>
        </form>
      </Modal>

      <Modal
        isOpen={isAddViewOpen}
        onClose={() => setIsAddViewOpen(false)}
        title="Initialize Module"
      >
        <div className="grid grid-cols-1 gap-4">
          {availableViewTypes.map((view) => {
            const isAlreadyAdded = dataset.views.includes(view);
            return (
              <button
                key={view}
                disabled={isAlreadyAdded}
                onClick={() => handleAddView(view)}
                className={`
                  flex items-center justify-between p-6 border transition-all text-left uppercase tracking-[0.2em] font-bold text-[10px] rounded-[1.5rem]
                  ${
                    isAlreadyAdded
                      ? "bg-white/5 border-white/5 text-zinc-700 cursor-not-allowed"
                      : "bg-zinc-900/50 border-white/10 text-zinc-400 hover:border-brand/50 hover:text-white hover:pl-8 group shadow-xl"
                  }
                `}
              >
                <span>{view} Processor</span>
                {isAlreadyAdded ? (
                  <span className="text-[8px] bg-white/5 text-zinc-600 px-3 py-1 rounded-full">
                    Active
                  </span>
                ) : (
                  <Plus className="w-4 h-4 text-brand opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
            );
          })}
        </div>
      </Modal>

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
