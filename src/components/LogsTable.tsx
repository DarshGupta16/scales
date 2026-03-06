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

// Extracted shared tag styling logic
function getOperationTagClass(operation: string, baseClasses: string) {
  const isCreate = operation.includes("CREATE") || operation.includes("ADD");
  const isDelete = operation.includes("DELETE") || operation.includes("REMOVE");
  
  const colorClasses = isCreate
    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
    : isDelete
      ? "bg-rose-500/10 border-rose-500/20 text-rose-500"
      : "bg-brand/10 border-brand/20 text-brand";

  return `${baseClasses} ${colorClasses}`;
}

export function LogsTable({ logs, type, isLoading }: LogsTableProps) {
  const sortedLogs = [...logs].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="w-full">
      {/* Desktop View */}
      <div className="hidden sm:block border border-white/5 bg-[#0a0a0a] rounded-[2rem] overflow-hidden shadow-2xl relative">
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
                      <span className={getOperationTagClass(log.operation, "px-3 py-1 rounded-full text-[9px] font-bold font-mono tracking-widest border")}>
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

      {/* Mobile View */}
      <div className="sm:hidden flex flex-col gap-4">
        <div className="flex items-center justify-between px-2 mb-2">
          <div className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500">
            {type === "local" ? (
              <>
                <Database className="w-3 h-3 text-brand" />
                <span>Local</span>
              </>
            ) : (
              <>
                <Server className="w-3 h-3 text-brand" />
                <span>Cloud</span>
              </>
            )}
          </div>
          <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest">
            {sortedLogs.length} Records
          </span>
        </div>

        {isLoading ? (
          <div className="py-20 text-center bg-[#0a0a0a] border border-white/5 rounded-2xl">
            <div className="w-6 h-6 border-2 border-brand/20 border-t-brand rounded-full animate-spin mx-auto mb-4" />
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              Interrogating...
            </span>
          </div>
        ) : sortedLogs.length === 0 ? (
          <div className="py-20 text-center bg-[#0a0a0a] border border-white/5 rounded-2xl">
            <Activity className="w-6 h-6 text-zinc-700 mx-auto mb-4" />
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              Void detected
            </span>
          </div>
        ) : (
          sortedLogs.map((log) => (
            <div
              key={log.id}
              className="bg-[#0a0a0a] border border-white/5 p-5 rounded-2xl flex flex-col gap-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs text-white font-mono">
                    <LocalTime
                      timestamp={log.timestamp}
                      options={{
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      }}
                    />
                  </span>
                  <span className="text-[9px] text-zinc-600 font-mono uppercase tracking-tighter">
                    <LocalTime
                      timestamp={log.timestamp}
                      options={{
                        month: "short",
                        day: "2-digit",
                      }}
                      transform={(s) => s.toUpperCase()}
                    />
                  </span>
                </div>
                <span className={getOperationTagClass(log.operation, "px-2 py-1 rounded-full text-[8px] font-bold font-mono tracking-widest border")}>
                  {log.operation}
                </span>
              </div>
              <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                <p className="text-[10px] text-zinc-500 font-mono break-all leading-relaxed">
                  {log.payload}
                </p>
              </div>
              <div className="flex items-center gap-2 opacity-30">
                <Hash className="w-2.5 h-2.5 text-zinc-500" />
                <span className="text-[8px] text-zinc-500 font-mono">
                  {log.id}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
