import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Info, Pencil, Trash2 } from "lucide-react";
import { useDatasetStore } from "@/store";
import type { Dataset } from "../../types/dataset";
import { DatasetGrid } from "./DatasetGrid";

interface DatasetListProps {
  datasets: Dataset[];
  onEdit?: (dataset: Dataset) => void;
  onDelete?: (dataset: Dataset) => void;
}

export function DatasetList({ datasets, onEdit, onDelete }: DatasetListProps) {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-0">
      <div className="flex flex-col gap-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-display font-extrabold text-white tracking-tighter uppercase leading-none mb-6 break-words sm:break-normal">
              Your
              <br />
              <span className="text-brand">Collections</span>
            </h2>
            <p className="text-sm text-zinc-500 font-sans uppercase tracking-[0.2em] border-l border-brand/50 pl-4">
              Refined metrics. Elegant tracking.
            </p>
          </div>
        </div>

        <div className="relative">
          {datasets.length > 0 ? (
            <div className="flex flex-col gap-2">
              <AnimatePresence mode="popLayout">
                {datasets.map((dataset) => (
                  <motion.div
                    key={dataset.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                    className="group relative flex items-center gap-6 p-4 bg-zinc-900/30 border border-white/5 hover:border-brand/30 hover:bg-zinc-900/50 transition-all rounded-2xl"
                  >
                    <Link
                      to="/datasets/$datasetId"
                      params={{ datasetId: dataset.id }}
                      className="flex-1 flex items-center gap-6"
                    >
                      <div className="w-12 h-12 flex items-center justify-center bg-brand/10 border border-brand/20 text-brand font-display font-black text-xs rounded-xl uppercase tracking-wider group-hover:scale-110 transition-transform">
                        {dataset.unit.symbol}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-white uppercase tracking-widest truncate group-hover:text-brand transition-colors">
                          {dataset.title}
                        </h4>
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">
                            {dataset.measurements.length} Records
                          </p>
                          <div className="w-1 h-1 rounded-full bg-zinc-800" />
                          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">
                            {dataset.unit.name}
                          </p>
                        </div>
                      </div>
                    </Link>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit?.(dataset)}
                        className="p-3 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete?.(dataset)}
                        className="p-3 text-zinc-500 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="w-px h-6 bg-white/5 mx-2" />
                      <Link
                        to="/datasets/$datasetId"
                        params={{ datasetId: dataset.id }}
                        className="p-3 text-brand hover:bg-brand/10 rounded-xl transition-all"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-32 bg-white/5 border border-white/10 rounded-4xl"
            >
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Info className="w-8 h-8 text-zinc-600" />
              </div>
              <h3 className="text-xl font-display font-bold text-white mb-2 uppercase tracking-tight">
                No records found
              </h3>
              <p className="text-zinc-500 font-sans uppercase tracking-widest text-xs">
                The void remains silent.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </main>
  );
}

interface DatasetViewProps {
  datasets: Dataset[];
  onEdit?: (dataset: Dataset) => void;
  onDelete?: (dataset: Dataset) => void;
}

export function DatasetView({ datasets, onEdit, onDelete }: DatasetViewProps) {
  const { preferences } = useDatasetStore();
  const viewMode = preferences.find((p) => p.preference === "view_mode")?.value || "grid";

  if (viewMode === "list") {
    return <DatasetList datasets={datasets} onEdit={onEdit} onDelete={onDelete} />;
  }

  return <DatasetGrid datasets={datasets} onEdit={onEdit} onDelete={onDelete} />;
}
