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
    <div className="w-full border-2 border-white bg-black">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-[#111] border-b-2 border-white">
            <tr>
              <th
                scope="col"
                className="px-6 py-4 text-left text-xs font-bold text-brand uppercase tracking-[0.2em]"
              >
                Timestamp
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-left text-xs font-bold text-brand uppercase tracking-[0.2em]"
              >
                Value
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-right text-xs font-bold text-brand uppercase tracking-[0.2em]"
              >
                Terminate
              </th>
            </tr>
          </thead>
          <tbody className="bg-black divide-y-2 divide-[#333]">
            {sortedMeasurements.map((measurement) => (
              <tr key={measurement.id} className="hover:bg-[#111] transition-colors group">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400 font-sans tracking-wider">
                  {new Date(measurement.timestamp).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).toUpperCase()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-lg font-bold text-white font-sans">
                  {measurement.value} <span className="text-zinc-500 font-normal uppercase text-xs ml-1 tracking-widest">{unit}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button
                    onClick={() => onDelete(measurement.id)}
                    className="text-zinc-600 hover:text-black hover:bg-[#ff3333] transition-colors p-2 border-2 border-transparent hover:border-white inline-flex"
                    title="Delete measurement"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
            {sortedMeasurements.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-zinc-600 font-bold uppercase tracking-widest">
                  NO DATA LOGGED.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
