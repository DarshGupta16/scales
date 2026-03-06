import type { Measurement } from "../types/dataset";
import { Trash2 } from "lucide-react";
import { LocalTime } from "./LocalTime";

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
    <div className="w-full">
      {/* Desktop Table View */}
      <div className="hidden sm:block border border-white/5 bg-[#0a0a0a] rounded-[2rem] overflow-hidden shadow-2xl">
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
                    <LocalTime
                      timestamp={measurement.timestamp}
                      options={{
                        dateStyle: "medium",
                        timeStyle: "short",
                      }}
                      transform={(s) => s.toUpperCase()}
                    />
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
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden flex flex-col gap-4">
        {sortedMeasurements.map((measurement) => (
          <div
            key={measurement.id}
            className="bg-[#0a0a0a] border border-white/5 p-5 rounded-2xl flex items-center justify-between"
          >
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-widest">
                <LocalTime
                  timestamp={measurement.timestamp}
                  options={{
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }}
                  transform={(s) => s.toUpperCase()}
                />
              </span>
              <span className="text-xl font-display font-black text-white">
                {measurement.value}{" "}
                <span className="text-brand text-xs ml-1">{unit}</span>
              </span>
            </div>
            <button
              onClick={() => onDelete(measurement.id)}
              className="w-10 h-10 flex items-center justify-center text-zinc-600 active:text-red-400 active:bg-red-400/10 rounded-xl transition-colors border border-white/5"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>

      {sortedMeasurements.length === 0 && (
        <div className="px-8 py-16 text-center bg-[#0a0a0a] border border-white/5 rounded-[2rem] text-zinc-600 font-bold uppercase tracking-[0.3em] text-xs">
          Records empty.
        </div>
      )}
    </div>
  );
}
