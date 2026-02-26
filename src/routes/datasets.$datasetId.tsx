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
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Dataset Not Found</h1>
        <p className="text-slate-500 mb-8 max-w-md">The dataset you're looking for doesn't exist or has been removed.</p>
        <Link
          to="/"
          className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-semibold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
        >
          Go Back Home
        </Link>
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
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Detail Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{dataset.title}</h1>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                {dataset.unit}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setIsAddMeasurementOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Data</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 gap-8">
          {/* Graph Section */}
          <section className="flex flex-col gap-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm min-h-[450px] flex flex-col">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <h2 className="text-lg font-bold text-slate-900">Visualization</h2>
                <ViewSwitcher
                  views={dataset.views}
                  activeView={activeView || "line"}
                  onViewChange={setActiveView}
                  onAddView={() => setIsAddViewOpen(true)}
                  onRemoveView={setConfirmRemoveView}
                />
              </div>
              
              <div className="flex-1 min-h-0">
                {activeView ? (
                  <DatasetGraph
                    data={dataset.measurements}
                    viewType={activeView}
                    unit={dataset.unit}
                  />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 italic">
                    No active view selected. Add a view to visualize data.
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Table Section */}
          <section className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Measurements History</h2>
              <span className="text-sm font-medium text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                {dataset.measurements.length} Total
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
        title="Add Measurement"
      >
        <form onSubmit={handleAddMeasurement} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-slate-700">Value ({dataset.unit})</label>
            <input
              autoFocus
              type="number"
              step="any"
              required
              placeholder="0.00"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-slate-700">Timestamp</label>
            <input
              type="datetime-local"
              required
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              value={newTimestamp}
              onChange={(e) => setNewTimestamp(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="mt-2 w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
          >
            Save Measurement
          </button>
        </form>
      </Modal>

      <Modal
        isOpen={isAddViewOpen}
        onClose={() => setIsAddViewOpen(false)}
        title="Add New View"
      >
        <div className="grid grid-cols-1 gap-3">
          {availableViewTypes.map((view) => {
            const isAlreadyAdded = dataset.views.includes(view);
            return (
              <button
                key={view}
                disabled={isAlreadyAdded}
                onClick={() => handleAddView(view)}
                className={`
                  flex items-center justify-between p-4 rounded-2xl border transition-all text-left
                  ${
                    isAlreadyAdded
                      ? "bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/30 group"
                  }
                `}
              >
                <span className="font-bold capitalize">{view} View</span>
                {isAlreadyAdded ? (
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-slate-200 text-slate-500 px-2 py-1 rounded">Added</span>
                ) : (
                  <Plus className="w-4 h-4 text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
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
        title="Delete Measurement"
        message="Are you sure you want to delete this data point? This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />

      <ConfirmDialog
        isOpen={!!confirmRemoveView}
        onClose={() => setConfirmRemoveView(null)}
        onConfirm={() => confirmRemoveView && handleRemoveView(confirmRemoveView)}
        title="Remove View"
        message={`Are you sure you want to remove the ${confirmRemoveView} view from this dataset?`}
        confirmText="Remove"
        type="danger"
      />
    </div>
  );
}
