import { type SyncLogEntry } from "../dexieDb";
import {
  Database,
  Server,
  Calendar,
  Hash,
  Activity,
  Terminal,
} from "lucide-react";
import { LocalTime } from "./LocalTime";

interface LogsTableProps {
  logs: SyncLogEntry[];
  type: "local" | "server";
  isLoading?: boolean;
}

export function LogsTable({ logs, type, isLoading }: LogsTableProps) {
  const sortedLogs = [...logs].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="w-full border border-white/5 bg-[#0a0a0a] rounded-[2rem] overflow-hidden shadow-2xl relative">
      <div className="absolute top-0 right-0 p-8 flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-600">
        {type === "local" ? (
          <>
            <Database className="w-3 h-3" />
            <span>Dexie Engine</span>
          </>
        ) : (
          <>
            <Server className="w-3 h-3" />
            <span>Cloud Sync</span>
          </>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-white/[0.02] border-b border-white/5">
            <tr>
              <th className="px-8 py-6 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em]">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  <span>Timestamp</span>
                </div>
              </th>
              <th className="px-8 py-6 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em]">
                <div className="flex items-center gap-2">
                  <Activity className="w-3 h-3" />
                  <span>Operation</span>
                </div>
              </th>
              <th className="px-8 py-6 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em]">
                <div className="flex items-center gap-2">
                  <Hash className="w-3 h-3" />
                  <span>ID</span>
                </div>
              </th>
              <th className="px-8 py-6 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em]">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3 h-3" />
                  <span>Payload</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-8 py-24 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-brand/20 border-t-brand rounded-full animate-spin" />
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                      Interrogating Database...
                    </span>
                  </div>
                </td>
              </tr>
            ) : sortedLogs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-8 py-24 text-center">
                  <div className="flex flex-col items-center gap-4 opacity-50">
                    <Activity className="w-8 h-8 text-zinc-600" />
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.3em]">
                      No sequence data available
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              sortedLogs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-white/[0.02] transition-colors group"
                >
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-xs text-white font-mono">
                        <LocalTime
                          timestamp={log.timestamp}
                          options={{
                            hour12: false,
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          }}
                        />
                        <span className="text-zinc-600 ml-1">
                          .{String(log.timestamp % 1000).padStart(3, "0")}
                        </span>
                      </span>
                      <span className="text-[9px] text-zinc-600 font-mono mt-1">
                        <LocalTime
                          timestamp={log.timestamp}
                          options={{
                            year: "numeric",
                            month: "short",
                            day: "2-digit",
                          }}
                          transform={(s) => s.toUpperCase()}
                        />
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <span
                      className={`
                      px-3 py-1 rounded-full text-[9px] font-bold font-mono tracking-widest border
                      ${
                        log.operation.includes("CREATE") ||
                        log.operation.includes("ADD")
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                          : log.operation.includes("DELETE") ||
                              log.operation.includes("REMOVE")
                            ? "bg-rose-500/10 border-rose-500/20 text-rose-500"
                            : "bg-brand/10 border-brand/20 text-brand"
                      }
                    `}
                    >
                      {log.operation}
                    </span>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <span className="text-[10px] text-zinc-500 font-mono group-hover:text-zinc-400 transition-colors">
                      {log.id.slice(0, 8)}
                      <span className="opacity-30">...</span>
                      {log.id.slice(-4)}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="max-w-xs xl:max-w-md">
                      <p className="text-[10px] text-zinc-500 font-mono line-clamp-1 group-hover:line-clamp-none transition-all cursor-help bg-black/40 p-2 rounded border border-white/5 overflow-hidden">
                        {log.payload}
                      </p>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
