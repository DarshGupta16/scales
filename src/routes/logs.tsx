import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useLogs } from "@/hooks/useLogs";
import { LogsHeader } from "../components/LogsHeader";
import { LogsTable } from "../components/LogsTable";
import { Database, Server } from "lucide-react";

export const Route = createFileRoute("/logs")({
  component: LogsPage,
});

function LogsPage() {
  const [activeTab, setActiveTab] = useState<"local" | "server">("local");

  const { localLogs, serverLogs, isServerLogsLoading } = useLogs();

  return (
    <div className="min-h-screen bg-[#050505] pb-32 selection:bg-brand selection:text-white relative">
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] z-[100]"
        style={{
          backgroundImage:
            'url("https://grainy-gradients.vercel.app/noise.svg")',
        }}
      ></div>

      <LogsHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-0">
        <div className="flex flex-col gap-12">
          {/* Tab Switcher */}
          <div className="flex items-center justify-between border-l-2 border-brand/50 pl-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveTab("local")}
                className={`
                  flex items-center gap-3 px-6 py-3 border text-[10px] font-bold uppercase tracking-[0.2em] transition-all rounded-xl
                  ${
                    activeTab === "local"
                      ? "bg-brand border-brand text-white shadow-lg shadow-brand/20"
                      : "bg-white/5 border-white/10 text-zinc-400 hover:border-brand/50 hover:text-white"
                  }
                `}
              >
                <Database className="w-4 h-4" />
                <span>Local Engine</span>
              </button>
              <button
                onClick={() => setActiveTab("server")}
                className={`
                  flex items-center gap-3 px-6 py-3 border text-[10px] font-bold uppercase tracking-[0.2em] transition-all rounded-xl
                  ${
                    activeTab === "server"
                      ? "bg-brand border-brand text-white shadow-lg shadow-brand/20"
                      : "bg-white/5 border-white/10 text-zinc-400 hover:border-brand/50 hover:text-white"
                  }
                `}
              >
                <Server className="w-4 h-4" />
                <span>Server Sequence</span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-4">
              <span className="text-[10px] font-bold font-mono text-zinc-500 uppercase tracking-[0.3em] px-4 py-2 bg-white/5 rounded-full border border-white/5">
                Total Sequence:{" "}
                {activeTab === "local" ? localLogs.length : serverLogs.length}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="relative group">
            {/* Aesthetic Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-brand/20 to-transparent rounded-[2.1rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            <LogsTable
              logs={activeTab === "local" ? localLogs : serverLogs}
              type={activeTab}
              isLoading={activeTab === "server" && isServerLogsLoading}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
