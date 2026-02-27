import type { ViewType } from "../types/dataset";
import {
  LineChart,
  BarChart2,
  AreaChart,
  PieChart,
  ScatterChart,
  Plus,
  X,
} from "lucide-react";

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
                flex items-center gap-2 px-4 py-2 border text-[10px] font-bold uppercase tracking-[0.2em] transition-all rounded-xl
                ${
                  isActive
                    ? "bg-brand border-brand text-white shadow-lg shadow-brand/20"
                    : "bg-white/5 border-white/10 text-zinc-400 hover:border-brand/50 hover:text-white"
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span>{view}</span>
            </button>

            {views.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveView(view);
                }}
                className={`
                  absolute -top-2 -right-2 w-5 h-5 bg-zinc-900 border border-white/10 rounded-full
                  flex items-center justify-center text-zinc-500 hover:text-red-400 hover:border-red-400/50
                  opacity-0 group-hover:opacity-100 transition-all z-10
                `}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        );
      })}

      <button
        onClick={onAddView}
        className="flex items-center gap-2 px-4 py-2 border border-dashed border-white/10 text-[10px] font-bold uppercase tracking-[0.2em] bg-transparent text-zinc-500 hover:border-brand/50 hover:text-brand transition-all rounded-xl"
      >
        <Plus className="w-4 h-4" />
        <span>Add</span>
      </button>
    </div>
  );
}
