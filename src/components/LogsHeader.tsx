import { Link } from "@tanstack/react-router";
import { ArrowLeft, Activity } from "lucide-react";

export function LogsHeader() {
  return (
    <header className="bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 relative z-50 sticky top-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="p-3 text-zinc-400 border border-white/10 hover:border-brand/50 hover:text-white hover:bg-white/5 transition-all rounded-xl"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand/10 border border-brand/20 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-brand" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-white uppercase tracking-tight">
                System Logs
              </h1>
              <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-[0.4em] mt-1">
                Synchronization Sequence
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
