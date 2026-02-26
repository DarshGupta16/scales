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
    <div className="flex flex-wrap items-center gap-2">
      {views.map((view) => {
        const Icon = viewIcons[view];
        const isActive = activeView === view;

        return (
          <div key={view} className="relative group">
            <button
              onClick={() => onViewChange(view)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all
                ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 shadow-sm"
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span className="capitalize">{view}</span>
            </button>
            
            {views.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveView(view);
                }}
                className={`
                  absolute -top-2 -right-2 w-5 h-5 bg-white border border-slate-200 rounded-full 
                  flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200
                  opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10
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
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all border border-transparent"
      >
        <Plus className="w-4 h-4" />
        <span>Add View</span>
      </button>
    </div>
  );
}
