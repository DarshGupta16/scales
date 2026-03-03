import type { Measurement, ViewType } from "@/types/dataset";
import { DatasetGraph } from "../DatasetGraph";
import { ViewSwitcher } from "../ViewSwitcher";

interface GraphSectionProps {
  measurements: Measurement[];
  unit: string;
  views: ViewType[];
  activeView: ViewType | null;
  onViewChange: (view: ViewType) => void;
  onAddView: () => void;
  onRemoveView: (view: ViewType) => void;
}

/**
 * GraphSection component
 * 
 * Displays the main visualization for a dataset. Includes the graph itself
 * and the view switcher to toggle between different chart types (line, bar, etc.).
 */
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
    <section>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.4em]">
          Telemetry visualization
        </h2>
        <ViewSwitcher
          views={views}
          activeView={activeView ?? "line"}
          onViewChange={onViewChange}
          onAddView={onAddView}
          onRemoveView={onRemoveView}
        />
      </div>

      <div className="brutal-card p-2">
        <DatasetGraph
          data={measurements}
          viewType={activeView ?? "line"}
          unit={unit}
        />
      </div>
    </section>
  );
}
