import { Loader2, Activity } from "lucide-react";
import { SearchBar } from "./SearchBar";
import { useTRPC } from "../trpc/client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

interface TopBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function TopBar({ searchQuery, setSearchQuery }: TopBarProps) {
  const trpc = useTRPC();
  const hello = useQuery(trpc.hello.queryOptions({ name: "Builder" }));

  return (
    <header className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-brand/10 border border-brand/20 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
            <img
              src="/icon.png"
              alt="Scales Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg sm:text-xl font-display font-bold text-white tracking-tight uppercase leading-tight">
              Scales
            </h1>
            <div className="hidden xs:flex items-center gap-2 text-[8px] sm:text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              {hello.isLoading ? (
                <Loader2 className="w-2 h-2 animate-spin" />
              ) : (
                <span className="text-brand">●</span>
              )}
              {hello.data?.greeting ?? "Connecting..."}
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-md">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/logs"
            className="hidden sm:flex items-center gap-2 px-4 py-2 text-zinc-400 hover:text-white transition-colors font-bold uppercase tracking-widest text-xs h-full"
          >
            <Activity className="w-4 h-4" />
            <span>Logs</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
