import { motion } from "framer-motion";
import { Info } from "lucide-react";
import { DatasetCard } from "./DatasetCard";
import type { Dataset } from "../types/dataset";

interface DatasetGridProps {
  datasets: Dataset[];
}

export function DatasetGrid({ datasets }: DatasetGridProps) {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-0">
      <div className="flex flex-col gap-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-6xl font-display font-extrabold text-white tracking-tighter uppercase leading-none mb-6">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {datasets.map((dataset) => (
              <DatasetCard key={dataset.id} dataset={dataset} />
            ))}
          </div>

          {datasets.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-32 bg-white/5 border border-white/10 rounded-[2rem]"
            >
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto">
                  <Info className="w-8 h-8 text-zinc-600" />
                </div>
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
