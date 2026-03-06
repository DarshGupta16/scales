import { Link, useLocation } from "@tanstack/react-router";
import { LayoutGrid, Activity } from "lucide-react";

export function BottomNav() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isLogs = location.pathname === "/logs";

  return (
    <nav className="sm:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-xs">
      <div className="bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 p-2 rounded-2xl flex items-center justify-around shadow-2xl shadow-black/50">
        <Link
          to="/"
          className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all duration-300 ${
            isHome
              ? "text-brand bg-brand/10 border border-brand/20 shadow-lg shadow-brand/10"
              : "text-zinc-500 hover:text-white"
          }`}
        >
          <LayoutGrid className={`w-5 h-5 ${isHome ? "stroke-[2.5]" : "stroke-2"}`} />
          <span className="text-[10px] font-display font-bold uppercase tracking-wider">
            Stack
          </span>
        </Link>

        <Link
          to="/logs"
          className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all duration-300 ${
            isLogs
              ? "text-brand bg-brand/10 border border-brand/20 shadow-lg shadow-brand/10"
              : "text-zinc-500 hover:text-white"
          }`}
        >
          <Activity className={`w-5 h-5 ${isLogs ? "stroke-[2.5]" : "stroke-2"}`} />
          <span className="text-[10px] font-display font-bold uppercase tracking-wider">
            Logs
          </span>
        </Link>
      </div>
    </nav>
  );
}
