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
            <Area
              type="monotone"
              dataKey="value"
              stroke="#6366f1"
              fill="#6366f1"
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </AreaChart>
        );
      case "bar":
        return (
          <BarChart data={previewData}>
            <Bar dataKey="value" fill="#6366f1" radius={[2, 2, 0, 0]} />
          </BarChart>
        );
      default:
        return (
          <LineChart data={previewData}>
            <Line
              type="monotone"
              dataKey="value"
              stroke="#6366f1"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        );
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group"
    >
      <Link
        to="/datasets/$datasetId"
        params={{ datasetId: dataset.id }}
        className="block h-full bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300"
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              {dataset.title}
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mt-2">
              {dataset.unit}
            </p>
          </div>
        </div>

        <div className="h-32 w-full mb-6 bg-slate-50/50 rounded-2xl p-2 min-h-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            {renderPreviewChart()}
          </ResponsiveContainer>
        </div>

        <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
          {dataset.description || "No description provided."}
        </p>
      </Link>
    </motion.div>
  );
}
