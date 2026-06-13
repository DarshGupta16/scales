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
import type { Dataset, Measurement, MeasurementValue } from "../../types/dataset";
import { formatDate } from "../../utils/format";

interface DatasetCardProps {
  dataset: Dataset;
  onEdit?: (dataset: Dataset) => void;
  onDelete?: (dataset: Dataset) => void;
}

interface PreviewData extends Measurement {
  tooltipId: string;
  displayDate: string;
  value: number;
  [key: string]: string | number | MeasurementValue[] | undefined;
}

interface CardTooltipPayload {
  payload: PreviewData;
  value: number | string;
}

const CustomTooltip = ({
  active,
  payload,
  dataset,
}: {
  active?: boolean;
  payload?: CardTooltipPayload[];
  dataset: Dataset;
}) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    const colors = ["#8b5cf6", "#06b6d4", "#10b981", "#ec4899", "#f59e0b", "#3b82f6"];

    return (
      <div className="bg-zinc-900 border border-white/20 p-2 rounded-lg shadow-xl pointer-events-none flex flex-col gap-1 min-w-[130px] z-50">
        <p className="text-[7px] font-bold text-zinc-500 uppercase tracking-wider leading-none mb-0.5 border-b border-white/5 pb-1">
          {data.displayDate}
        </p>
        <div className="flex flex-col gap-0.5">
          {dataset.metrics.map((metric, i) => {
            const val = data[metric.id];
            const displayVal = typeof val === "number" || typeof val === "string" ? val : "—";
            const color = colors[i % colors.length];

            return (
              <div key={metric.id} className="flex items-center justify-between gap-3">
                <span className="text-[7px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1 truncate max-w-[80px]">
                  <div
                    className="w-1 h-1 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="truncate">{metric.name}</span>
                </span>
                <span className="text-[10px] font-display font-black text-white shrink-0">
                  {displayVal}{" "}
                  <span className="text-white/40 text-[7px] font-normal lowercase ml-0.5">
                    {metric.unit.symbol || metric.unit.name}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
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
      content={<CustomTooltip dataset={dataset} />}
      cursor={{ stroke: "rgba(139, 92, 246, 0.1)", strokeWidth: 1.5 }}
      isAnimationActive={false}
    />
  );

  const colors = [
    "#8b5cf6", // Violet-500 (Brand)
    "#06b6d4", // Cyan-500
    "#10b981", // Emerald-500
    "#ec4899", // Pink-500
    "#f59e0b", // Amber-500
    "#3b82f6", // Blue-500
  ];

  switch (viewType) {
    case "area":
      return (
        <AreaChart data={data}>
          <defs>
            {dataset.metrics.map((metric, i) => {
              const color = colors[i % colors.length];
              return (
                <linearGradient
                  key={metric.id}
                  id={`grad-${dataset.id}-${metric.id}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              );
            })}
          </defs>
          {commonAxis}
          {tooltip}
          {dataset.metrics.map((metric, i) => (
            <Area
              key={metric.id}
              type="monotone"
              dataKey={metric.id}
              stroke={colors[i % colors.length]}
              fill={`url(#grad-${dataset.id}-${metric.id})`}
              strokeWidth={1.5}
              isAnimationActive={false}
            />
          ))}
        </AreaChart>
      );
    case "bar":
      return (
        <BarChart data={data}>
          {commonAxis}
          {tooltip}
          {dataset.metrics.map((metric, i) => (
            <Bar
              key={metric.id}
              dataKey={metric.id}
              fill={colors[i % colors.length]}
              radius={[3, 3, 0, 0]}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      );
    default:
      return (
        <LineChart data={data}>
          {commonAxis}
          {tooltip}
          {dataset.metrics.map((metric, i) => (
            <Line
              key={metric.id}
              type="monotone"
              dataKey={metric.id}
              stroke={colors[i % colors.length]}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          ))}
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
    const sortedData = [...(dataset.measurements || [])].sort((a, b) => a.timestamp - b.timestamp);
    return sortedData.slice(-7).map((m, index) => {
      const dataPoint: PreviewData = {
        ...m,
        value: m.values[0]?.value || 0,
        tooltipId: `${m.id || index}-${m.timestamp}`,
        displayDate: isClient ? formatDate(m.timestamp, "short") : "",
      };
      for (const val of m.values) {
        dataPoint[val.metricId] = val.value;
      }
      return dataPoint;
    });
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
            {dataset.type === "composite" ? (
              <div className="flex flex-col gap-1 mt-2">
                <span className="text-[8px] font-sans font-bold text-brand uppercase tracking-[0.2em] px-2 py-0.5 bg-brand/10 border border-brand/20 rounded-md w-max">
                  Composite
                </span>
                <span className="text-[9px] font-sans font-medium text-zinc-500 uppercase tracking-[0.1em] truncate max-w-[180px]">
                  {dataset.metrics.map((m) => m.name).join(" • ")}
                </span>
              </div>
            ) : (
              <p className="text-[10px] font-sans font-bold text-zinc-500 uppercase tracking-[0.2em] mt-2">
                {dataset.unit?.symbol || dataset.unit?.name || "?"}
              </p>
            )}
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
                <motion.div
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
