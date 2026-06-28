import type { Dataset } from "../../types/dataset";
import { Select } from "../ui/Select";
import { isValidDateStr } from "./tableUtils";
import type { useDatasetTableFilters } from "./useDatasetTableFilters";

interface DatasetTableFiltersProps {
  dataset: Dataset;
  state: ReturnType<typeof useDatasetTableFilters>["state"];
  actions: ReturnType<typeof useDatasetTableFilters>["actions"];
}

export function DatasetTableFilters({ dataset, state, actions }: DatasetTableFiltersProps) {
  const {
    filterStartTime,
    filterEndTime,
    minValue,
    maxValue,
    filterMetricId,
    syncWithGraph,
    hasActiveFilters,
  } = state;

  const {
    setFilterStartTime,
    setFilterEndTime,
    setMinValue,
    setMaxValue,
    setFilterMetricId,
    flushStartTime,
    flushEndTime,
    clearFilters,
    onSyncWithGraphChange,
  } = actions;

  const handleStartTimeChange = (val: string) => {
    setFilterStartTime(val);
    if (isValidDateStr(val) || val === "") {
      flushStartTime(val);
    }
  };

  const handleEndTimeChange = (val: string) => {
    setFilterEndTime(val);
    if (isValidDateStr(val) || val === "") {
      flushEndTime(val);
    }
  };

  const handleStartTimeBlur = () => {
    flushStartTime(filterStartTime);
  };

  const handleEndTimeBlur = () => {
    flushEndTime(filterEndTime);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, type: "start" | "end") => {
    if (e.key === "Enter") {
      if (type === "start") {
        flushStartTime(filterStartTime);
      } else {
        flushEndTime(filterEndTime);
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 bg-[#0a0a0a] p-6 border border-white/5 rounded-3xl mb-6 shadow-xl">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-end gap-4 flex-1">
          {/* Start Date-Time */}
          <div className="flex flex-col gap-1.5 flex-1 min-w-[160px] max-w-xs">
            <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1">
              Start Date
            </span>
            <input
              type="datetime-local"
              value={filterStartTime}
              onChange={(e) => handleStartTimeChange(e.target.value)}
              onBlur={handleStartTimeBlur}
              onKeyDown={(e) => handleKeyDown(e, "start")}
              className="brutal-input text-[10px] py-2.5 px-3 scheme-dark w-full cursor-pointer"
            />
          </div>

          {/* End Date-Time */}
          <div className="flex flex-col gap-1.5 flex-1 min-w-[160px] max-w-xs">
            <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1">
              End Date
            </span>
            <input
              type="datetime-local"
              value={filterEndTime}
              onChange={(e) => handleEndTimeChange(e.target.value)}
              onBlur={handleEndTimeBlur}
              onKeyDown={(e) => handleKeyDown(e, "end")}
              className="brutal-input text-[10px] py-2.5 px-3 scheme-dark w-full cursor-pointer"
            />
          </div>

          {/* Metric Selector (Composite Only) */}
          {dataset.type === "composite" && (
            <div className="flex flex-col gap-1.5 min-w-[150px]">
              <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1">
                Metric Filter
              </span>
              <Select
                value={filterMetricId}
                onChange={setFilterMetricId}
                options={[
                  { value: "any", label: "ANY METRIC" },
                  ...dataset.metrics.map((metric) => ({
                    value: metric.id,
                    label: metric.name.toUpperCase(),
                  })),
                ]}
                className="w-full"
              />
            </div>
          )}

          {/* Min Value Filter */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1">
              Min Bound
            </span>
            <input
              type="number"
              placeholder="Min value"
              value={minValue}
              onChange={(e) => setMinValue(e.target.value)}
              className="w-28 px-4 py-3 bg-zinc-950/50 border border-white/10 text-white font-sans text-xs focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all rounded-xl placeholder-zinc-600"
            />
          </div>

          {/* Max Value Filter */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1">
              Max Bound
            </span>
            <input
              type="number"
              placeholder="Max value"
              value={maxValue}
              onChange={(e) => setMaxValue(e.target.value)}
              className="w-28 px-4 py-3 bg-zinc-950/50 border border-white/10 text-white font-sans text-xs focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all rounded-xl placeholder-zinc-600"
            />
          </div>

          {/* Clear Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="px-4 py-3 bg-white/5 text-zinc-400 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:bg-white/10 active:scale-95"
            >
              Clear
            </button>
          )}
        </div>

        {/* Sync Checkbox */}
        <div className="flex items-center gap-3">
          <button
            id="sync-graph-toggle"
            type="button"
            onClick={() => onSyncWithGraphChange(!syncWithGraph)}
            className={`
              w-9 h-4.5 rounded-full p-0.5 transition-all duration-300 relative border cursor-pointer
              ${syncWithGraph ? "bg-brand/10 border-brand/40 shadow-[0_0_10px_rgba(139,92,246,0.1)]" : "bg-zinc-900 border-white/5"}
            `}
          >
            <div
              className={`
                w-3 h-3 rounded-full transition-all duration-500 ease-out
                ${syncWithGraph ? "translate-x-4.5 bg-brand shadow-[0_0_8px_rgba(139,92,246,0.6)]" : "translate-x-0 bg-zinc-700"}
              `}
            />
          </button>
          <label
            htmlFor="sync-graph-toggle"
            className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest cursor-pointer select-none hover:text-white transition-colors"
          >
            Reflect filters on graph
          </label>
        </div>
      </div>
    </div>
  );
}
