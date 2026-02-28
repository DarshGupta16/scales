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
  XAxis,
  Tooltip,
} from "recharts";
import { motion } from "framer-motion";
import { useEffect, useState, useMemo } from "react";

interface DatasetCardProps {
  dataset: Dataset;
}

export function DatasetCard({ dataset }: DatasetCardProps) {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Use the last 7 measurements for the preview chart, sorted chronologically
  const previewData = useMemo(() => {
    return dataset.measurements
      .slice(-7)
      .map((m, index) => ({
        ...m,
        tooltipId: `${m.id || index}-${m.timestamp}`,
        displayDate: new Date(m.timestamp).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
      }));
  }, [dataset.measurements]);

  const viewType = dataset.views[0] || "line";

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900 border border-white/20 p-2 rounded-lg shadow-xl pointer-events-none">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider leading-none mb-1">
            {payload[0].payload.displayDate}
          </p>
          <p className="text-sm font-display font-black text-brand leading-none">
            {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  const renderPreviewChart = () => {
    if (!isClient) return null;

    const commonAxis = (
      <XAxis dataKey="tooltipId" hide />
    );
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
          <AreaChart data={previewData}>
            <defs>
              <linearGradient
                id={`gradient-${dataset.id}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
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
              fill={`url(#gradient-${dataset.id})`}
              strokeWidth={2}
              isAnimationActive={false}
            />
          </AreaChart>
        );
      case "bar":
        return (
          <BarChart data={previewData}>
            {commonAxis}
            {tooltip}
            <Bar
              dataKey="value"
              fill="#8b5cf6"
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        );
      default:
        return (
          <LineChart data={previewData}>
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

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Link
        to="/datasets/$datasetId"
        params={{ datasetId: dataset.slug }}
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
          <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={0}
            minHeight={0}
          >
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
