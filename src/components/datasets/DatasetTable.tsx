import { ArrowDown, ArrowUp, ArrowUpDown, Check, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { CustomRange, Dataset, Measurement, Timeline } from "../../types/dataset";
import { Select } from "../ui/Select";

const parseLocalDatetime = (dateStr: string) => {
  if (!dateStr) return NaN;
  const parsed = new Date(dateStr).getTime();
  return Number.isNaN(parsed) ? NaN : parsed;
};

const formatTimestampToDatetimeLocal = (ts: number) => {
  if (!ts || ts === 0 || ts === Infinity) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear().toString().padStart(4, "0");
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const r = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${r}T${h}:${min}`;
};

interface DatasetTableProps {
  dataset: Dataset;
  measurements: Measurement[];
  onDelete: (id: string) => void;
  onDeleteMultiple: (ids: string[]) => void;
  syncWithGraph: boolean;
  onSyncWithGraphChange: (sync: boolean) => void;
  onFilteredMeasurementsChange: (filtered: Measurement[]) => void;
  timeline: Timeline;
  onTimelineChange: (timeline: Timeline) => void;
  customRange: CustomRange;
  onCustomRangeChange: (customRange: CustomRange) => void;
}

export function DatasetTable({
  dataset,
  measurements,
  onDelete,
  onDeleteMultiple,
  syncWithGraph,
  onSyncWithGraphChange,
  onFilteredMeasurementsChange,
  timeline,
  onTimelineChange,
  customRange,
  onCustomRangeChange,
}: DatasetTableProps) {
  const [isClient, setIsClient] = useState(false);
  const [filterStartTime, setFilterStartTime] = useState("");
  const [filterEndTime, setFilterEndTime] = useState("");
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");
  const [filterMetricId, setFilterMetricId] = useState("any");

  const [sortColumn, setSortColumn] = useState<string>("timestamp");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const temporalRange = useMemo(() => {
    const now = Date.now();
    if (timeline === "day") {
      return { start: now - 24 * 3600 * 1000, end: now };
    }
    if (timeline === "week") {
      return { start: now - 7 * 24 * 3600 * 1000, end: now };
    }
    if (timeline === "custom") {
      return customRange;
    }
    return { start: 0, end: Infinity };
  }, [timeline, customRange]);

  const parentStartVal = useMemo(() => {
    return timeline === "all" ? "" : formatTimestampToDatetimeLocal(temporalRange.start);
  }, [timeline, temporalRange.start]);

  const parentEndVal = useMemo(() => {
    return timeline === "all" ? "" : formatTimestampToDatetimeLocal(temporalRange.end);
  }, [timeline, temporalRange.end]);

  // Synchronize local input state with parent when synced
  useEffect(() => {
    if (syncWithGraph) {
      setFilterStartTime(parentStartVal);
      setFilterEndTime(parentEndVal);
    }
  }, [syncWithGraph, parentStartVal, parentEndVal]);

  const isValidDateStr = (str: string) => {
    if (str.length !== 16) return false;
    const [datePart, timePart] = str.split("T");
    if (!datePart || !timePart) return false;
    const dateParts = datePart.split("-");
    if (dateParts.length !== 3) return false;
    const [y, m, d] = dateParts.map(Number);
    return (
      !Number.isNaN(y) &&
      !Number.isNaN(m) &&
      !Number.isNaN(d) &&
      y > 1000 &&
      m >= 1 &&
      m <= 12 &&
      d >= 1 &&
      d <= 31
    );
  };

  const flushStartTime = (val: string) => {
    if (syncWithGraph) {
      if (val === "") {
        onTimelineChange("all");
      } else {
        const parsed = parseLocalDatetime(val);
        if (!Number.isNaN(parsed) && isValidDateStr(val)) {
          onTimelineChange("custom");
          onCustomRangeChange({
            start: parsed,
            end: temporalRange.end === Infinity ? Date.now() : temporalRange.end,
          });
        } else {
          setFilterStartTime(parentStartVal);
        }
      }
    }
  };

  const flushEndTime = (val: string) => {
    if (syncWithGraph) {
      if (val === "") {
        onTimelineChange("all");
      } else {
        const parsed = parseLocalDatetime(val);
        if (!Number.isNaN(parsed) && isValidDateStr(val)) {
          onTimelineChange("custom");
          onCustomRangeChange({
            start: temporalRange.start === 0 ? Date.now() - 24 * 3600 * 1000 : temporalRange.start,
            end: parsed,
          });
        } else {
          setFilterEndTime(parentEndVal);
        }
      }
    }
  };

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

  const clearFilters = () => {
    if (syncWithGraph) {
      onTimelineChange("all");
    } else {
      setFilterStartTime("");
      setFilterEndTime("");
    }
    setMinValue("");
    setMaxValue("");
    setFilterMetricId("any");
  };

  const baseMeasurements = syncWithGraph ? measurements : dataset.measurements || [];

  const filteredMeasurements = useMemo(() => {
    return baseMeasurements.filter((m) => {
      // 1. If not syncing with graph, apply local table date range filters.
      // (If syncing, baseMeasurements is already filtered by parent temporal window).
      if (!syncWithGraph) {
        if (filterStartTime) {
          const startMs = parseLocalDatetime(filterStartTime);
          if (!Number.isNaN(startMs) && m.timestamp < startMs) {
            return false;
          }
        }
        if (filterEndTime) {
          const endMs = parseLocalDatetime(filterEndTime);
          if (!Number.isNaN(endMs) && m.timestamp > endMs) {
            return false;
          }
        }
      }

      // 2. Numerical filter
      const min = minValue !== "" ? Number(minValue) : -Infinity;
      const max = maxValue !== "" ? Number(maxValue) : Infinity;

      if (dataset.type === "composite") {
        if (filterMetricId === "any") {
          return m.values.some((v) => v.value >= min && v.value <= max);
        } else {
          const valRecord = m.values.find((v) => v.metricId === filterMetricId);
          if (!valRecord) return false;
          return valRecord.value >= min && valRecord.value <= max;
        }
      } else {
        const val = m.values[0]?.value ?? 0;
        return val >= min && val <= max;
      }
    });
  }, [
    baseMeasurements,
    syncWithGraph,
    filterStartTime,
    filterEndTime,
    minValue,
    maxValue,
    filterMetricId,
    dataset.type,
  ]);

  // Notify parent of filtered measurements
  useEffect(() => {
    onFilteredMeasurementsChange(filteredMeasurements);
  }, [filteredMeasurements, onFilteredMeasurementsChange]);

  const sortedAndFilteredMeasurements = useMemo(() => {
    const list = [...filteredMeasurements];
    if (!sortColumn) return list;

    list.sort((a, b) => {
      let va = 0;
      let vb = 0;

      if (sortColumn === "timestamp") {
        va = a.timestamp;
        vb = b.timestamp;
      } else if (dataset.type === "composite") {
        va = a.values.find((v) => v.metricId === sortColumn)?.value ?? 0;
        vb = b.values.find((v) => v.metricId === sortColumn)?.value ?? 0;
      } else {
        va = a.values[0]?.value ?? 0;
        vb = b.values[0]?.value ?? 0;
      }

      if (va === vb) return 0;
      return sortDirection === "asc" ? va - vb : vb - va;
    });

    return list;
  }, [filteredMeasurements, sortColumn, sortDirection, dataset.type]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  const renderSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="w-3.5 h-3.5 opacity-30" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 text-brand" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-brand" />
    );
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const isAllSelected =
    filteredMeasurements.length > 0 &&
    filteredMeasurements.every((m) => selectedIds.includes(m.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      const filteredIds = new Set(filteredMeasurements.map((m) => m.id));
      setSelectedIds((prev) => prev.filter((id) => !filteredIds.has(id)));
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const m of filteredMeasurements) {
          next.add(m.id);
        }
        return Array.from(next);
      });
    }
  };

  const hasActiveFilters = syncWithGraph
    ? timeline !== "all" || minValue !== "" || maxValue !== "" || filterMetricId !== "any"
    : filterStartTime !== "" ||
      filterEndTime !== "" ||
      minValue !== "" ||
      maxValue !== "" ||
      filterMetricId !== "any";

  return (
    <div className="w-full flex flex-col">
      {/* Search and Filters Bar */}
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

      {/* Floating Selection Panel */}
      {selectedIds.length > 0 && (
        <div className="flex justify-between items-center bg-red-950/20 border border-red-500/20 px-6 py-4 rounded-2xl mb-6 shadow-[0_0_20px_rgba(239,68,68,0.05)] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-4">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            <span className="text-[10px] font-bold font-sans text-red-400 uppercase tracking-[0.2em]">
              {selectedIds.length} sequence point{selectedIds.length > 1 ? "s" : ""} marked for
              erasure
            </span>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-xl text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-all active:scale-95"
            >
              Clear Selection
            </button>
            <button
              type="button"
              onClick={() => {
                onDeleteMultiple(selectedIds);
                setSelectedIds([]);
              }}
              className="px-5 py-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-wider text-red-400 transition-all active:scale-95 shadow-lg shadow-red-500/5"
            >
              Purge Selected
            </button>
          </div>
        </div>
      )}

      {/* Table Main view */}
      <div className="w-full border border-white/5 bg-[#0a0a0a] rounded-[2rem] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-white/[0.02] border-b border-white/5">
              <tr>
                {/* Select All Checkbox Header */}
                <th scope="col" className="w-16 px-8 py-5 text-left">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className={`
                      w-4 h-4 rounded-md border flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer
                      ${
                        isAllSelected
                          ? "bg-brand border-brand text-white shadow-[0_0_8px_rgba(139,92,246,0.5)]"
                          : "border-white/20 bg-zinc-950 hover:border-brand/50"
                      }
                    `}
                    aria-label="Select all entries"
                  >
                    {isAllSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </button>
                </th>
                <th
                  scope="col"
                  onClick={() => handleSort("timestamp")}
                  className="px-8 py-5 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] cursor-pointer select-none hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span>Timeline</span>
                    {renderSortIcon("timestamp")}
                  </div>
                </th>
                {dataset.type === "composite" ? (
                  dataset.metrics.map((metric) => (
                    <th
                      key={metric.id}
                      scope="col"
                      onClick={() => handleSort(metric.id)}
                      className="px-8 py-5 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] cursor-pointer select-none hover:text-white transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span>{metric.name}</span>
                        {renderSortIcon(metric.id)}
                      </div>
                    </th>
                  ))
                ) : (
                  <th
                    scope="col"
                    onClick={() => handleSort("magnitude")}
                    className="px-8 py-5 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] cursor-pointer select-none hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span>Magnitude</span>
                      {renderSortIcon("magnitude")}
                    </div>
                  </th>
                )}
                <th
                  scope="col"
                  className="px-8 py-5 text-right text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em]"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sortedAndFilteredMeasurements.map((measurement) => (
                <tr key={measurement.id} className="hover:bg-white/[0.02] transition-colors group">
                  {/* Select Row Checkbox */}
                  <td className="px-8 py-5 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => toggleSelect(measurement.id)}
                      className={`
                        w-4 h-4 rounded-md border flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer
                        ${
                          selectedIds.includes(measurement.id)
                            ? "bg-brand border-brand text-white shadow-[0_0_8px_rgba(139,92,246,0.5)]"
                            : "border-white/20 bg-zinc-950 hover:border-brand/50"
                        }
                      `}
                      aria-label="Select entry"
                    >
                      {selectedIds.includes(measurement.id) && (
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      )}
                    </button>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap text-xs text-zinc-400 font-sans tracking-wider">
                    {isClient
                      ? new Date(measurement.timestamp)
                          .toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                          .toUpperCase()
                      : ""}
                  </td>
                  {dataset.type === "composite" ? (
                    dataset.metrics.map((metric) => {
                      const valRecord = measurement.values.find((v) => v.metricId === metric.id);
                      return (
                        <td
                          key={metric.id}
                          className="px-8 py-5 whitespace-nowrap text-base font-bold text-white font-sans"
                        >
                          {valRecord !== undefined && valRecord !== null ? (
                            <>
                              {valRecord.value}{" "}
                              <span className="text-brand/50 font-normal uppercase text-[10px] ml-1 tracking-[0.2em]">
                                {metric.unit.symbol || metric.unit.name}
                              </span>
                            </>
                          ) : (
                            <span className="text-zinc-600 font-normal">—</span>
                          )}
                        </td>
                      );
                    })
                  ) : (
                    <td className="px-8 py-5 whitespace-nowrap text-base font-bold text-white font-sans">
                      {measurement.values[0]?.value ?? 0}{" "}
                      <span className="text-brand/50 font-normal uppercase text-[10px] ml-1 tracking-[0.2em]">
                        {dataset.unit?.symbol || dataset.unit?.name || "?"}
                      </span>
                    </td>
                  )}
                  <td className="px-8 py-5 whitespace-nowrap text-right">
                    <button
                      type="button"
                      onClick={() => onDelete(measurement.id)}
                      className="text-zinc-600 hover:text-red-400 transition-colors p-2 rounded-xl hover:bg-red-400/10 cursor-pointer"
                      title="Delete entry"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {sortedAndFilteredMeasurements.length === 0 && (
                <tr>
                  <td
                    colSpan={dataset.type === "composite" ? dataset.metrics.length + 3 : 4}
                    className="px-8 py-16 text-center text-zinc-600 font-bold uppercase tracking-[0.3em] text-xs"
                  >
                    Records empty.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
