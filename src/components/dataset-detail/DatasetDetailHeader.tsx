import { Link } from "@tanstack/react-router";
import { ArrowLeft, Plus } from "lucide-react";

interface DatasetDetailHeaderProps {
  title: string;
  unit: string;
  onAddMeasurement: () => void;
}

export function DatasetDetailHeader({
  title,
  unit,
  onAddMeasurement,
}: DatasetDetailHeaderProps) {
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
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white uppercase tracking-tight">
              {title}
            </h1>
            <p className="text-[10px] font-sans font-bold text-brand uppercase tracking-[0.4em] mt-2 ml-1">
              {unit}
            </p>
          </div>
        </div>

        <button
          onClick={onAddMeasurement}
          className="hidden sm:flex items-center gap-3 px-6 py-3 bg-brand text-white font-bold uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-brand/20 hover:brightness-110 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Inject Data</span>
        </button>

        <button
          onClick={onAddMeasurement}
          className="sm:hidden flex items-center justify-center w-12 h-12 bg-brand text-white rounded-xl shadow-lg shadow-brand/20 active:scale-95"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>
      </div>
    </header>
  );
}
