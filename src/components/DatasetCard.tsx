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
              type="step"
              dataKey="value"
              stroke="#ccff00"
              fill="#ccff00"
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </AreaChart>
        );
      case "bar":
        return (
          <BarChart data={previewData}>
            <Bar dataKey="value" fill="#ccff00" />
          </BarChart>
        );
      default:
        return (
          <LineChart data={previewData}>
            <Line
              type="step"
              dataKey="value"
              stroke="#ccff00"
              strokeWidth={3}
              dot={false}
            />
          </LineChart>
        );
    }
  };

  return (
    <Link
      to="/datasets/$datasetId"
      params={{ datasetId: dataset.id }}
      className="block h-full brutal-card group bg-black"
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-2xl font-display font-extrabold text-white uppercase tracking-tighter group-hover:text-brand transition-colors">
            {dataset.title}
          </h3>
          <p className="text-xs font-sans font-bold text-zinc-500 uppercase tracking-[0.2em] mt-1 border-l-2 border-brand pl-2">
            {dataset.unit}
          </p>
        </div>
      </div>

      <div className="h-32 w-full mb-6 bg-[#111] border-2 border-[#333] p-2 min-h-0 relative overflow-hidden group-hover:border-white transition-colors">
        {/* Grid lines inside chart container */}
        <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          {renderPreviewChart()}
        </ResponsiveContainer>
      </div>

      <p className="text-sm font-sans text-zinc-400 line-clamp-2 leading-relaxed uppercase">
        {dataset.description || "NO PARAMETERS PROVIDED."}
      </p>
    </Link>
  );
}
