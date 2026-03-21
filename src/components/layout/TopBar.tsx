import { LayoutGrid, List, Settings2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useDatasetStore, useAppStore } from "@/store";
import { SearchBar } from "../ui/SearchBar";

interface TopBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function TopBar({ searchQuery, onSearchChange }: TopBarProps) {
  const { preferences, updatePreferences } = useDatasetStore();
  const { setUnitsModalOpen } = useAppStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const viewPref = preferences.find((p) => p.preference === "view_mode");
  const viewMode = viewPref?.value || "grid";

  const handleToggleView = () => {
    const nextMode = viewMode === "grid" ? "list" : "grid";
    updatePreferences(viewPref?.id, "upsert", {
      preference: "view_mode",
      value: nextMode,
    });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

        <div className="flex items-center gap-1 md:gap-2">
          {/* Desktop/Tablet Buttons */}
          <div className="hidden md:flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleView}
              className="flex items-center gap-2 px-4 py-2 text-zinc-400 hover:text-white transition-colors font-bold uppercase tracking-widest text-[10px] h-full"
            >
              {viewMode === "grid" ? (
                <>
                  <LayoutGrid className="w-4 h-4 text-brand" />
                  <span>Grid</span>
                </>
              ) : (
                <>
                  <List className="w-4 h-4 text-brand" />
                  <span>List</span>
                </>
              )}
            </button>
            <div className="w-px h-6 bg-white/5" />
            <button
              type="button"
              onClick={() => setUnitsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-zinc-400 hover:text-white transition-colors font-bold uppercase tracking-widest text-[10px] h-full"
            >
              <Settings2 className="w-4 h-4 text-brand" />
              <span>Units</span>
            </button>
          </div>

          {/* Mobile/Small Tablet Preferences Button */}
          <div className="md:hidden relative" ref={mobileMenuRef}>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-3 rounded-xl border transition-all ${
                isMobileMenuOpen 
                  ? "bg-brand/10 border-brand/50 text-white" 
                  : "bg-white/5 border-white/5 text-zinc-400 hover:text-white"
              }`}
            >
              <Settings2 className="w-5 h-5" />
            </button>

            {isMobileMenuOpen && (
              <div className="absolute right-0 mt-3 w-48 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <button
                  type="button"
                  onClick={() => {
                    handleToggleView();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-4 text-[10px] font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-all uppercase tracking-widest text-left"
                >
                  {viewMode === "grid" ? <List className="w-4 h-4 text-brand" /> : <LayoutGrid className="w-4 h-4 text-brand" />}
                  {viewMode === "grid" ? "Switch to List" : "Switch to Grid"}
                </button>
                <div className="h-px bg-white/5 mx-4" />
                <button
                  type="button"
                  onClick={() => {
                    setUnitsModalOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-4 text-[10px] font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-all uppercase tracking-widest text-left"
                >
                  <Settings2 className="w-4 h-4 text-brand" />
                  Manage Units
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
