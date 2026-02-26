import { Link } from "@tanstack/react-router";
import type { Dataset } from "../types/dataset";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";
import { motion } from "framer-motion";

interface DatasetCardProps {
  dataset: Dataset;
}

export function DatasetCard({ dataset }: DatasetCardProps) {
  // Use the last 7 measurements for the preview chart
  const previewData = dataset.measurements.slice(-7);
  const viewType = dataset.views[0] || "line";

  const renderPreviewChart = () => {
    switch (viewType) {
      case "area":
        return (
          <AreaChart data={previewData}>
            <defs>
              <linearGradient id={`gradient-${dataset.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke="#8b5cf6"
              fill={`url(#gradient-${dataset.id})`}
              strokeWidth={2}
            />
          </AreaChart>
        );
      case "bar":
        return (
          <BarChart data={previewData}>
            <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      default:
        return (
          <LineChart data={previewData}>
            <Line
              type="monotone"
              dataKey="value"
              stroke="#8b5cf6"
              strokeWidth={2.5}
              dot={false}
            />
          </LineChart>
        );
    }
  };

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
              {dataset.unit}
            </p>
          </div>
        </div>

        <div className="h-28 w-full mb-6 bg-white/[0.02] border border-white/5 rounded-2xl p-2 min-h-0 relative overflow-hidden group-hover:border-brand/20 transition-colors">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            {renderPreviewChart()}
          </ResponsiveContainer>
        </div>

        <p className="text-xs font-sans text-zinc-500 line-clamp-2 leading-relaxed uppercase tracking-wider">
          {dataset.description || "Refined tracking parameters."}
        </p>
      </Link>
    </motion.div>
  );
}
