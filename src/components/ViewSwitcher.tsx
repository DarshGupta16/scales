import type { ViewType } from "../types/dataset";
import { LineChart, BarChart2, AreaChart, PieChart, ScatterChart, Plus, X } from "lucide-react";

interface ViewSwitcherProps {
  views: ViewType[];
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  onAddView: () => void;
  onRemoveView: (view: ViewType) => void;
}

const viewIcons: Record<ViewType, any> = {
  line: LineChart,
  bar: BarChart2,
  area: AreaChart,
  pie: PieChart,
  scatter: ScatterChart,
};

export function ViewSwitcher({
  views,
  activeView,
  onViewChange,
  onAddView,
  onRemoveView,
}: ViewSwitcherProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {views.map((view) => {
        const Icon = viewIcons[view];
        const isActive = activeView === view;

        return (
          <div key={view} className="relative group">
            <button
              onClick={() => onViewChange(view)}
              className={`
                flex items-center gap-2 px-4 py-2 border-2 text-sm font-bold uppercase tracking-widest transition-all rounded-none
                ${
                  isActive
                    ? "bg-brand border-brand text-black shadow-[4px_4px_0_0_rgba(255,255,255,1)]"
                    : "bg-black border-white text-white hover:border-brand hover:text-brand"
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span>{view}</span>
            </button>
            
            {views.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveView(view);
                }}
                className={`
                  absolute -top-3 -right-3 w-6 h-6 bg-black border-2 border-white 
                  flex items-center justify-center text-white hover:bg-[#ff3333] hover:text-white hover:border-white
                  opacity-0 group-hover:opacity-100 transition-opacity z-10 rounded-none
                `}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      })}

      <button
        onClick={onAddView}
        className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-zinc-600 text-sm font-bold uppercase tracking-widest bg-transparent text-zinc-400 hover:border-white hover:text-white transition-all rounded-none"
      >
        <Plus className="w-5 h-5" />
        <span>ADD</span>
      </button>
    </div>
  );
}
