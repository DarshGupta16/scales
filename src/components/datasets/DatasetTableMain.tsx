import { ArrowDown, ArrowUp, ArrowUpDown, Check, Trash2 } from "lucide-react";
import { memo, useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useDatasetStore } from "@/store";
import type { Dataset } from "../../types/dataset";

interface DatasetTableMainProps {
  dataset: Dataset;
  measurements: string[]; // now an array of IDs
  selectedIds: string[];
  sortColumn: string;
  sortDirection: "asc" | "desc";
  isAllSelected: boolean;
  onSort: (column: string) => void;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onDelete: (id: string) => void;
}

const DatasetTableRow = memo(function DatasetTableRow({
  measurementId,
  dataset,
  isSelected,
  onToggleSelect,
  onDelete,
  isClient,
}: {
  measurementId: string;
  dataset: Dataset;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  isClient: boolean;
}) {
  const measurement = useDatasetStore(useShallow((state) => state.measurementsById[measurementId]));
  const valuesById = useDatasetStore((state) => state.valuesById);

  if (!measurement) return null;

  return (
    <tr className="hover:bg-white/[0.02] transition-colors group">
      <td className="px-8 py-5 whitespace-nowrap">
        <button
          type="button"
          onClick={() => onToggleSelect(measurement.id)}
          className={`
            w-4 h-4 rounded-md border flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer
            ${
              isSelected
                ? "bg-brand border-brand text-white shadow-[0_0_8px_rgba(139,92,246,0.5)]"
                : "border-white/20 bg-zinc-950 hover:border-brand/50"
            }
          `}
          aria-label="Select entry"
        >
          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
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
        dataset.metricIds.map((metricId) => {
          const valRecordId = measurement.valueIds.find(
            (vId) => valuesById[vId]?.metricId === metricId,
          );
          const valRecord = valRecordId ? valuesById[valRecordId] : undefined;
          const metric = useDatasetStore.getState().metricsById[metricId];
          return (
            <td
              key={metricId}
              className="px-8 py-5 whitespace-nowrap text-base font-bold text-white font-sans"
            >
              {valRecord !== undefined && valRecord !== null && metric ? (
                <>
                  {valRecord.value}{" "}
                  <span className="text-brand/50 font-normal uppercase text-[10px] ml-1 tracking-[0.2em]">
                    {metric.unit?.symbol || metric.unit?.name || ""}
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
          {measurement.valueIds.length > 0 ? (valuesById[measurement.valueIds[0]]?.value ?? 0) : 0}{" "}
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
  );
});

export const DatasetTableMain = memo(function DatasetTableMain({
  dataset,
  measurements,
  selectedIds,
  sortColumn,
  sortDirection,
  isAllSelected,
  onSort,
  onToggleSelect,
  onToggleSelectAll,
  onDelete,
}: DatasetTableMainProps) {
  const [isClient, setIsClient] = useState(false);
  const metricsById = useDatasetStore((state) => state.metricsById);

  useEffect(() => {
    setIsClient(true);
  }, []);

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

  return (
    <div className="w-full border border-white/5 bg-[#0a0a0a] rounded-[2rem] overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-white/[0.02] border-b border-white/5">
            <tr>
              <th scope="col" className="w-16 px-8 py-5 text-left">
                <button
                  type="button"
                  onClick={onToggleSelectAll}
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
                onClick={() => onSort("timestamp")}
                className="px-8 py-5 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] cursor-pointer select-none hover:text-white transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span>Timeline</span>
                  {renderSortIcon("timestamp")}
                </div>
              </th>
              {dataset.type === "composite" ? (
                dataset.metricIds.map((metricId) => {
                  const metric = metricsById[metricId];
                  if (!metric) return null;
                  return (
                    <th
                      key={metric.id}
                      scope="col"
                      onClick={() => onSort(metric.id)}
                      className="px-8 py-5 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] cursor-pointer select-none hover:text-white transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span>{metric.name}</span>
                        {renderSortIcon(metric.id)}
                      </div>
                    </th>
                  );
                })
              ) : (
                <th
                  scope="col"
                  onClick={() => onSort("magnitude")}
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
            {measurements.map((measurementId) => (
              <DatasetTableRow
                key={measurementId}
                measurementId={measurementId}
                dataset={dataset}
                isSelected={selectedIds.includes(measurementId)}
                onToggleSelect={onToggleSelect}
                onDelete={onDelete}
                isClient={isClient}
              />
            ))}
            {measurements.length === 0 && (
              <tr>
                <td
                  colSpan={dataset.type === "composite" ? dataset.metricIds.length + 3 : 4}
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
  );
});
