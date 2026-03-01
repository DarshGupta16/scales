import { motion } from "framer-motion";
import { Info } from "lucide-react";
import { DatasetCard } from "./DatasetCard";
import type { Dataset } from "../types/dataset";
import { useEffect, useState } from "react";

interface DatasetGridProps {
  datasets: Dataset[];
}

// Sub-component for the glowing skeleton loader
function SkeletonCard() {
  return (
    <div className="h-full brutal-card relative overflow-hidden">
      {/* Shimmer animation overlay */}
      <motion.div
        className="absolute inset-0 z-10 w-full h-full -translate-x-full bg-gradient-to-r from-transparent via-white/[0.03] to-transparent skew-x-[-20deg]"
        animate={{
          translateX: ["-100%", "200%"],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <div className="flex justify-between items-start mb-6">
        <div className="w-full">
          <div className="h-6 w-1/2 bg-white/5 rounded-md mb-3" />
          <div className="h-3 w-1/4 bg-white/5 rounded-sm" />
        </div>
      </div>

      <div className="h-28 w-full mb-6 bg-white/[0.02] border border-white/5 rounded-2xl p-2 relative overflow-hidden" />

      <div className="space-y-2 mt-auto">
        <div className="h-3 w-full bg-white/5 rounded-sm" />
        <div className="h-3 w-2/3 bg-white/5 rounded-sm" />
      </div>
    </div>
  );
}

export function DatasetGrid({ datasets }: DatasetGridProps) {
  // Track if hydration/initial load has happened to prevent the empty state flash
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // We set hydrated to true immediately on mount. Because useEffect only 
    // runs on the client after the initial HTML render, this effectively 
    // acts as our "Dexie has had a chance to mount and fire" flag.
    setIsHydrated(true);
  }, []);

  const isEmpty = datasets.length === 0;

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
          {/* 
            Show skeletons during SSR or before hydration completes.
            If hydrated and not empty, show the actual cards.
          */}
          {(!isHydrated || !isEmpty) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {!isHydrated
                ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={`skel-${i}`} />)
                : datasets.map((dataset) => (
                    <DatasetCard key={dataset.id} dataset={dataset} />
                  ))}
            </div>
          )}

          {/* Only show the empty state if we are hydrated AND the array is genuinely empty */}
          {isHydrated && isEmpty && (
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
