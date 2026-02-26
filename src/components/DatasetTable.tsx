import type { Measurement } from "../types/dataset";
import { Trash2 } from "lucide-react";

interface DatasetTableProps {
  measurements: Measurement[];
  unit: string;
  onDelete: (id: string) => void;
}

export function DatasetTable({ measurements, unit, onDelete }: DatasetTableProps) {
  const sortedMeasurements = [...measurements].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider"
              >
                Timestamp
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider"
              >
                Value
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {sortedMeasurements.map((measurement) => (
              <tr key={measurement.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                  {new Date(measurement.timestamp).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                  {measurement.value} <span className="text-slate-400 font-normal uppercase text-[10px] ml-1">{unit}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => onDelete(measurement.id)}
                    className="text-slate-300 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50"
                    title="Delete measurement"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {sortedMeasurements.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-slate-400 italic">
                  No measurements recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
