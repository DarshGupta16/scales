import { memo } from "react";

interface DatasetTableSelectionPanelProps {
  selectedCount: number;
  onClear: () => void;
  onPurge: () => void;
}

export const DatasetTableSelectionPanel = memo(function DatasetTableSelectionPanel({
  selectedCount,
  onClear,
  onPurge,
}: DatasetTableSelectionPanelProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex justify-between items-center bg-red-950/20 border border-red-500/20 px-6 py-4 rounded-2xl mb-6 shadow-[0_0_20px_rgba(239,68,68,0.05)] animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-4">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
        <span className="text-[10px] font-bold font-sans text-red-400 uppercase tracking-[0.2em]">
          {selectedCount} sequence point{selectedCount > 1 ? "s" : ""} marked for erasure
        </span>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClear}
          className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-xl text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-all active:scale-95"
        >
          Clear Selection
        </button>
        <button
          type="button"
          onClick={onPurge}
          className="px-5 py-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-wider text-red-400 transition-all active:scale-95 shadow-lg shadow-red-500/5"
        >
          Purge Selected
        </button>
      </div>
    </div>
  );
});
