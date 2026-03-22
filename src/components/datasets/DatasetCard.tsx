import { Link } from "@tanstack/react-router";
import { AnimatePresence, m } from "framer-motion";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { Dataset, Measurement } from "../../types/dataset";
import { formatDate } from "../../utils/format";

const PreviewChart = lazy(() => import("./PreviewChart"));

interface DatasetCardProps {
  dataset: Dataset;
  onEdit?: (dataset: Dataset) => void;
  onDelete?: (dataset: Dataset) => void;
}

interface PreviewData extends Measurement {
  tooltipId: string;
  displayDate: string;
}

export function DatasetCard({ dataset, onEdit, onDelete }: DatasetCardProps) {
  const [isClient, setIsClient] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  const previewData = useMemo<PreviewData[]>(() => {
    const sortedData = [...(dataset.measurements || [])].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
    return sortedData.slice(-7).map((m, index) => ({
      ...m,
      tooltipId: `${m.id || index}-${m.timestamp}`,
      displayDate: isClient ? formatDate(m.timestamp, "short") : "",
    }));
  }, [dataset.measurements, isClient]);

  return (
    <m.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Link
        to="/datasets/$datasetId"
        params={{ datasetId: dataset.id }}
        preload="intent"
        className="block h-full brutal-card group"
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-display font-bold text-white uppercase tracking-tight group-hover:text-brand transition-colors">
              {dataset.title}
            </h3>
            <p className="text-[10px] font-sans font-bold text-zinc-500 uppercase tracking-[0.2em] mt-2">
              {dataset.unit.symbol || dataset.unit.name}
            </p>
          </div>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            <AnimatePresence>
              {isMenuOpen && (
                <m.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onEdit?.(dataset);
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-all uppercase tracking-widest"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDelete?.(dataset);
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500/70 hover:text-red-500 hover:bg-red-500/5 transition-all uppercase tracking-widest border-t border-white/5"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </m.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="h-28 w-full mb-6 bg-white/2 border border-white/5 rounded-2xl p-2 min-h-0 relative overflow-hidden group-hover:border-brand/20 transition-colors">
          {isClient ? (
            <Suspense
              fallback={<div className="w-full h-full animate-pulse bg-white/5 rounded-lg" />}
            >
              <PreviewChart dataset={dataset} data={previewData} />
            </Suspense>
          ) : (
            <div />
          )}
        </div>

        <p className="text-xs font-sans text-zinc-500 line-clamp-2 leading-relaxed uppercase tracking-wider min-h-10">
          {dataset.description || "Refined tracking parameters."}
        </p>
      </Link>
    </m.div>
  );
}
