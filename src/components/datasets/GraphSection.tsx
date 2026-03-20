import { useEffect, useState } from "react";
import type { Dataset, ViewType } from "../../types/dataset";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { DatasetGraph } from "./DatasetGraph";
import { InitializeModuleModal } from "./InitializeModuleModal";
import { ViewSwitcher } from "./ViewSwitcher";

interface GraphSectionProps {
  dataset: Dataset;
  onUpdateDataset: (updatedDataset: Dataset) => void;
}

export function GraphSection({ dataset, onUpdateDataset }: GraphSectionProps) {
  const [activeView, setActiveView] = useState<ViewType | null>(dataset.views[0] || "line");

  const [isAddViewOpen, setIsAddViewOpen] = useState(false);
  const [confirmRemoveView, setConfirmRemoveView] = useState<ViewType | null>(null);

  useEffect(() => {
    if (dataset && activeView && !dataset.views.includes(activeView)) {
      setActiveView(dataset.views[0] || "line");
    }
  }, [dataset, activeView]);

  const handleAddView = (view: ViewType) => {
    if (dataset.views.includes(view)) return;

    onUpdateDataset({ ...dataset, views: [...dataset.views, view] });
    setActiveView(view);
    setIsAddViewOpen(false);
  };

  const handleRemoveView = (view: ViewType) => {
    const updatedViews = dataset.views.filter((v) => v !== view);
    onUpdateDataset({ ...dataset, views: updatedViews });

    if (activeView === view) {
      setActiveView(updatedViews[0] || null);
    }
    setConfirmRemoveView(null);
  };

  return (
    <section className="flex flex-col gap-8">
      <div className="bg-[#0a0a0a] p-8 sm:p-12 border border-white/5 rounded-[3rem] shadow-2xl min-h-137.5 flex flex-col">
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
              data={dataset.measurements || []}
              viewType={activeView}
              unit={dataset.unit.symbol || dataset.unit.name}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-700 font-sans uppercase tracking-[0.3em] font-bold text-xs">
              [ SYSTEM STANDBY. SELECT MODULE. ]
            </div>
          )}
        </div>
      </div>

      <InitializeModuleModal
        isOpen={isAddViewOpen}
        onClose={() => setIsAddViewOpen(false)}
        onAddView={handleAddView}
        existingViews={dataset.views}
      />

      <ConfirmDialog
        isOpen={!!confirmRemoveView}
        onClose={() => setConfirmRemoveView(null)}
        onConfirm={() => confirmRemoveView && handleRemoveView(confirmRemoveView)}
        title="Deactivate Module"
        message={`Confirm deactivation of the ${confirmRemoveView?.toUpperCase()} renderer from this dataset.`}
        confirmText="Deactivate"
        type="danger"
      />
    </section>
  );
}
