import { LayoutGrid } from "lucide-react";
import { SearchBar } from "../ui/SearchBar";

interface TopBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function TopBar({ searchQuery, onSearchChange }: TopBarProps) {
  return (
    <header className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5">
      <div
        suppressHydrationWarning
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand/10 border border-brand/20 rounded-xl flex items-center justify-center overflow-hidden">
            <img src="/icon.png" alt="Scales Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-xl font-display font-bold text-white tracking-tight uppercase hidden sm:block">
            Scales
          </h1>
        </div>

        <div className="flex-1 max-w-md">
          <SearchBar value={searchQuery} onChange={onSearchChange} />
        </div>

        <div className="flex items-center gap-2">
          <button className="hidden sm:flex items-center gap-2 px-4 py-2 text-zinc-400 hover:text-white transition-colors font-bold uppercase tracking-widest text-xs h-full">
            <LayoutGrid className="w-4 h-4" />
            <span>Grid</span>
          </button>
        </div>
      </div>
    </header>
  );
}
