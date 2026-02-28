import { ViewSwitcher } from "../ViewSwitcher";
import { DatasetGraph } from "../DatasetGraph";
import type { ViewType, Measurement } from "../../types/dataset";

interface GraphSectionProps {
  measurements: Measurement[];
  unit: string;
  views: ViewType[];
  activeView: ViewType | null;
  onViewChange: (view: ViewType) => void;
  onAddView: () => void;
  onRemoveView: (view: ViewType) => void;
}

export function GraphSection({
  measurements,
  unit,
  views,
  activeView,
  onViewChange,
  onAddView,
  onRemoveView,
}: GraphSectionProps) {
  return (
    <section className="flex flex-col gap-8">
      <div className="bg-[#0a0a0a] p-8 sm:p-12 border border-white/5 rounded-[3rem] shadow-2xl min-h-[550px] flex flex-col">
        <div className="flex flex-wrap items-center justify-between gap-8 mb-12 border-b border-white/5 pb-8">
          <h2 className="text-xl font-display font-bold text-white uppercase tracking-tight flex items-center gap-4">
            <div className="w-2 h-2 rounded-full bg-brand animate-pulse"></div>
            Neural Matrix
          </h2>
          <ViewSwitcher
            views={views}
            activeView={activeView || "line"}
            onViewChange={onViewChange}
            onAddView={onAddView}
            onRemoveView={onRemoveView}
          />
        </div>

        <div className="flex-1 min-h-0 bg-black/40 rounded-3xl overflow-hidden border border-white/5">
          {activeView ? (
            <DatasetGraph
              data={measurements}
              viewType={activeView}
              unit={unit}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-700 font-sans uppercase tracking-[0.3em] font-bold text-xs">
              [ SYSTEM STANDBY. SELECT MODULE. ]
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
