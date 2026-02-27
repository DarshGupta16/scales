import type { Measurement } from "../types/dataset";
import { Trash2 } from "lucide-react";

interface DatasetTableProps {
  measurements: Measurement[];
  unit: string;
  onDelete: (id: string) => void;
}

export function DatasetTable({
  measurements,
  unit,
  onDelete,
}: DatasetTableProps) {
  const sortedMeasurements = [...measurements].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return (
    <div className="w-full border border-white/5 bg-[#0a0a0a] rounded-[2rem] overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-white/[0.02] border-b border-white/5">
            <tr>
              <th
                scope="col"
                className="px-8 py-5 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em]"
              >
                Timeline
              </th>
              <th
                scope="col"
                className="px-8 py-5 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em]"
              >
                Magnitude
              </th>
              <th
                scope="col"
                className="px-8 py-5 text-right text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em]"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sortedMeasurements.map((measurement) => (
              <tr
                key={measurement.id}
                className="hover:bg-white/[0.02] transition-colors group"
              >
                <td className="px-8 py-5 whitespace-nowrap text-xs text-zinc-400 font-sans tracking-wider">
                  {new Date(measurement.timestamp)
                    .toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                    .toUpperCase()}
                </td>
                <td className="px-8 py-5 whitespace-nowrap text-base font-bold text-white font-sans">
                  {measurement.value}{" "}
                  <span className="text-brand/50 font-normal uppercase text-[10px] ml-1 tracking-[0.2em]">
                    {unit}
                  </span>
                </td>
                <td className="px-8 py-5 whitespace-nowrap text-right">
                  <button
                    onClick={() => onDelete(measurement.id)}
                    className="text-zinc-600 hover:text-red-400 transition-colors p-2 rounded-xl hover:bg-red-400/10"
                    title="Delete entry"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
            {sortedMeasurements.length === 0 && (
              <tr>
                <td
                  colSpan={3}
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
}
