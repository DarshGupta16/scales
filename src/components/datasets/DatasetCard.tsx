import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import type { Dataset, Measurement } from "../../types/dataset";
import { formatDate } from "../../utils/format";

interface DatasetCardProps {
  dataset: Dataset;
  onEdit?: (dataset: Dataset) => void;
  onDelete?: (dataset: Dataset) => void;
}

interface PreviewData extends Measurement {
  tooltipId: string;
  displayDate: string;
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload as PreviewData;
    return (
      <div className="bg-zinc-900 border border-white/20 p-2 rounded-lg shadow-xl pointer-events-none">
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider leading-none mb-1">
          {data.displayDate}
        </p>
        <p className="text-sm font-display font-black text-brand leading-none">
          {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

const PreviewChart = ({ dataset, data }: { dataset: Dataset; data: PreviewData[] }) => {
  const viewType = dataset.views[0] ?? "line";
  const commonAxis = <XAxis dataKey="tooltipId" hide />;
  const tooltip = (
    <Tooltip
      content={<CustomTooltip />}
      cursor={{ stroke: "rgba(139, 92, 246, 0.2)", strokeWidth: 2 }}
      isAnimationActive={false}
    />
  );

  switch (viewType) {
    case "area":
      return (
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`grad-${dataset.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>
          {commonAxis}
          {tooltip}
          <Area
            type="monotone"
            dataKey="value"
            stroke="#8b5cf6"
            fill={`url(#grad-${dataset.id})`}
            strokeWidth={2}
            isAnimationActive={false}
          />
        </AreaChart>
      );
    case "bar":
      return (
        <BarChart data={data}>
          {commonAxis}
          {tooltip}
          <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      );
    default:
      return (
        <LineChart data={data}>
          {commonAxis}
          {tooltip}
          <Line
            type="monotone"
            dataKey="value"
            stroke="#8b5cf6"
            strokeWidth={2.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      );
  }
};

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
    return (dataset.measurements || []).slice(-7).map((m, index) => ({
      ...m,
      tooltipId: `${m.id || index}-${m.timestamp}`,
      displayDate: isClient ? formatDate(m.timestamp, "short") : "",
    }));
  }, [dataset.measurements, isClient]);

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Link
        to="/datasets/$datasetId"
        params={{ datasetId: dataset.id }}
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
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden"
                >
                  <button
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="h-28 w-full mb-6 bg-white/2 border border-white/5 rounded-2xl p-2 min-h-0 relative overflow-hidden group-hover:border-brand/20 transition-colors">
          <ResponsiveContainer width="100%" height="100%">
            {isClient ? <PreviewChart dataset={dataset} data={previewData} /> : <div />}
          </ResponsiveContainer>
        </div>

        <p className="text-xs font-sans text-zinc-500 line-clamp-2 leading-relaxed uppercase tracking-wider min-h-10">
          {dataset.description || "Refined tracking parameters."}
        </p>
      </Link>
    </motion.div>
  );
}
