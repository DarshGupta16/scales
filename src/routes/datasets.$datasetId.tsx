import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { mockDatasets } from "../data/mockDatasets";
import { DatasetGraph } from "../components/DatasetGraph";
import { ViewSwitcher } from "../components/ViewSwitcher";
import { DatasetTable } from "../components/DatasetTable";
import { Modal } from "../components/Modal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ArrowLeft, Plus } from "lucide-react";
import type { ViewType, Measurement } from "../types/dataset";

export const Route = createFileRoute("/datasets/$datasetId")({
  component: DatasetDetail,
});

function DatasetDetail() {
  const { datasetId } = Route.useParams();
  
  // In a real app, this would be managed by TanStack Query
  const [allDatasets, setAllDatasets] = useState(mockDatasets);
  
  const dataset = useMemo(() => {
    return allDatasets.find((d) => d.id === datasetId);
  }, [allDatasets, datasetId]);

  const [activeView, setActiveView] = useState<ViewType | null>(
    dataset?.views[0] || "line"
  );

  // Modals state
  const [isAddMeasurementOpen, setIsAddMeasurementOpen] = useState(false);
  const [isAddViewOpen, setIsAddViewOpen] = useState(false);
  const [confirmDeleteMeasurement, setConfirmDeleteMeasurement] = useState<string | null>(null);
  const [confirmRemoveView, setConfirmRemoveView] = useState<ViewType | null>(null);

  // Form states
  const [newValue, setNewValue] = useState("");
  const [newTimestamp, setNewTimestamp] = useState(new Date().toISOString().slice(0, 16));

  if (!dataset) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-black selection:bg-brand selection:text-black relative">
        <div className="fixed inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        <div className="bg-[#111] p-12 border-4 border-white brutal-shadow relative z-10">
          <h1 className="text-6xl font-display font-extrabold text-white mb-6 uppercase tracking-tighter">DATASET<br/><span className="text-[#ff3333]">NULL</span></h1>
          <p className="text-zinc-400 font-sans uppercase tracking-widest mb-10 border-l-4 border-[#ff3333] pl-4 text-left">Entity not found or purged from records.</p>
          <Link
            to="/"
            className="inline-block brutal-btn w-full"
          >
            RETURN TO ROOT
          </Link>
        </div>
      </div>
    );
  }

  const handleAddMeasurement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue || isNaN(Number(newValue))) return;

    const newMeasurement: Measurement = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date(newTimestamp).toISOString(),
      value: Number(newValue),
    };

    setAllDatasets((prev) =>
      prev.map((d) =>
        d.id === datasetId
          ? { ...d, measurements: [...d.measurements, newMeasurement] }
          : d
      )
    );

    setIsAddMeasurementOpen(false);
    setNewValue("");
  };

  const handleDeleteMeasurement = (id: string) => {
    setAllDatasets((prev) =>
      prev.map((d) =>
        d.id === datasetId
          ? { ...d, measurements: d.measurements.filter((m) => m.id !== id) }
          : d
      )
    );
  };

  const handleAddView = (view: ViewType) => {
    if (dataset.views.includes(view)) return;

    setAllDatasets((prev) =>
      prev.map((d) =>
        d.id === datasetId
          ? { ...d, views: [...d.views, view] }
          : d
      )
    );
    setActiveView(view);
    setIsAddViewOpen(false);
  };

  const handleRemoveView = (view: ViewType) => {
    setAllDatasets((prev) =>
      prev.map((d) =>
        d.id === datasetId
          ? { ...d, views: d.views.filter((v) => v !== view) }
          : d
      )
    );
    if (activeView === view) {
      const remainingViews = dataset.views.filter((v) => v !== view);
      setActiveView(remainingViews[0] || null);
    }
  };

  const availableViewTypes: ViewType[] = ["line", "bar", "area", "pie", "scatter"];

  return (
    <div className="min-h-screen bg-black pb-20 selection:bg-brand selection:text-black relative">
      <div className="fixed inset-0 pointer-events-none opacity-20 z-0" style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      
      {/* Detail Header */}
      <header className="bg-black border-b-4 border-white brutal-shadow relative z-10 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="p-3 text-white border-2 border-white hover:bg-white hover:text-black transition-all rounded-none"
            >
              <ArrowLeft className="w-6 h-6 stroke-[3]" />
            </Link>
            <div>
              <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-white uppercase tracking-tighter">{dataset.title}</h1>
              <p className="text-sm font-sans font-bold text-brand uppercase tracking-[0.3em] mt-1">
                UNIT: {dataset.unit}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setIsAddMeasurementOpen(true)}
            className="hidden sm:flex items-center gap-3 px-6 py-3 border-2 border-white bg-brand text-black font-bold uppercase tracking-widest brutal-shadow-brand hover:-translate-y-1 hover:translate-x-1 hover:shadow-[8px_8px_0_0_var(--color-brand)] transition-all active:translate-y-1 active:translate-x-1 active:shadow-none"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
            <span>INJECT DATA</span>
          </button>
          
          <button
            onClick={() => setIsAddMeasurementOpen(true)}
            className="sm:hidden flex items-center justify-center w-12 h-12 border-2 border-white bg-brand text-black brutal-shadow-brand active:translate-y-1 active:translate-x-1 active:shadow-none"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-0">
        <div className="grid grid-cols-1 gap-12">
          {/* Graph Section */}
          <section className="flex flex-col gap-6">
            <div className="bg-[#050505] p-6 sm:p-10 border-4 border-white brutal-shadow min-h-[500px] flex flex-col">
              <div className="flex flex-wrap items-center justify-between gap-6 mb-10 border-b-2 border-[#333] pb-6">
                <h2 className="text-2xl font-display font-bold text-white uppercase tracking-tight flex items-center gap-3">
                  <span className="w-4 h-4 bg-brand inline-block"></span>
                  Visual Matrix
                </h2>
                <ViewSwitcher
                  views={dataset.views}
                  activeView={activeView || "line"}
                  onViewChange={setActiveView}
                  onAddView={() => setIsAddViewOpen(true)}
                  onRemoveView={setConfirmRemoveView}
                />
              </div>
              
              <div className="flex-1 min-h-0 border-2 border-[#333] p-1 bg-black">
                {activeView ? (
                  <DatasetGraph
                    data={dataset.measurements}
                    viewType={activeView}
                    unit={dataset.unit}
                  />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-600 font-sans uppercase tracking-widest font-bold">
                    [ NO ACTIVE RENDERER. SYSTEM STANDBY. ]
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Table Section */}
          <section className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-l-4 border-brand pl-4">
              <h2 className="text-2xl font-display font-bold text-white uppercase tracking-tight">Raw Log</h2>
              <span className="text-sm font-bold font-sans text-brand border-2 border-brand px-4 py-1 uppercase tracking-widest bg-[#111]">
                ENTRIES: {dataset.measurements.length}
              </span>
            </div>
            <div className="brutal-shadow border-4 border-white bg-black">
              <DatasetTable
                measurements={dataset.measurements}
                unit={dataset.unit}
                onDelete={setConfirmDeleteMeasurement}
              />
            </div>
          </section>
        </div>
      </main>

      {/* Modals */}
      <Modal
        isOpen={isAddMeasurementOpen}
        onClose={() => setIsAddMeasurementOpen(false)}
        title="INJECT NEW MEASUREMENT"
      >
        <form onSubmit={handleAddMeasurement} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-brand uppercase tracking-widest">Value ({dataset.unit})</label>
            <input
              autoFocus
              type="number"
              step="any"
              required
              placeholder="0.00"
              className="brutal-input text-xl"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-brand uppercase tracking-widest">Timestamp</label>
            <input
              type="datetime-local"
              required
              className="brutal-input [color-scheme:dark]"
              value={newTimestamp}
              onChange={(e) => setNewTimestamp(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="mt-4 brutal-btn-brand py-4 text-lg w-full"
          >
            WRITE TO LOG
          </button>
        </form>
      </Modal>

      <Modal
        isOpen={isAddViewOpen}
        onClose={() => setIsAddViewOpen(false)}
        title="INITIALIZE RENDERER"
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
                  flex items-center justify-between p-5 border-2 transition-all text-left uppercase tracking-widest font-bold
                  ${
                    isAlreadyAdded
                      ? "bg-[#111] border-[#333] text-zinc-600 cursor-not-allowed"
                      : "bg-black border-white text-white hover:border-brand hover:text-brand hover:pl-8 group"
                  }
                `}
              >
                <span>{view} RENDERER</span>
                {isAlreadyAdded ? (
                  <span className="text-[10px] bg-[#333] text-zinc-400 px-3 py-1">ACTIVE</span>
                ) : (
                  <Plus className="w-5 h-5 text-brand opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
            );
          })}
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmDeleteMeasurement}
        onClose={() => setConfirmDeleteMeasurement(null)}
        onConfirm={() => confirmDeleteMeasurement && handleDeleteMeasurement(confirmDeleteMeasurement)}
        title="PURGE ENTRY"
        message="CONFIRM PURGE OF SELECTED DATA POINT. THIS ACTION IS IRREVERSIBLE AND WILL PERMANENTLY ALTER THE LOG."
        confirmText="EXECUTE PURGE"
        type="danger"
      />

      <ConfirmDialog
        isOpen={!!confirmRemoveView}
        onClose={() => setConfirmRemoveView(null)}
        onConfirm={() => confirmRemoveView && handleRemoveView(confirmRemoveView)}
        title="DISABLE RENDERER"
        message={`CONFIRM DEACTIVATION OF [${confirmRemoveView?.toUpperCase()}] RENDERER MODULE FROM THIS DATASET.`}
        confirmText="DISABLE"
        type="danger"
      />
    </div>
  );
}
