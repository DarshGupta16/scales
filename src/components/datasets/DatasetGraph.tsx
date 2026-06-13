import { AnimatePresence, motion } from "framer-motion";
import { Info } from "lucide-react";
import { useState } from "react";
import { ResponsiveContainer } from "recharts";
import { useChartData } from "../../hooks/useChartData";
import type { Dataset, Measurement, ViewType } from "../../types/dataset";
import { AreaRenderer } from "./charts/AreaRenderer";
import { BarRenderer } from "./charts/BarRenderer";
import { LineRenderer } from "./charts/LineRenderer";
import { PieRenderer } from "./charts/PieRenderer";
import { ScatterRenderer } from "./charts/ScatterRenderer";
import { COLORS } from "./charts/types";

interface DatasetGraphProps {
  dataset: Dataset;
  data: Measurement[];
  viewType: ViewType;
}

export function DatasetGraph({ dataset, data, viewType }: DatasetGraphProps) {
  const [isFocused, setIsFocused] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);

  const { isClient, visibleMetricIds, visibleMetrics, chartData, pieData, toggleMetricVisibility } =
    useChartData(dataset, data);

  const renderContent = () => {
    if (!isClient) return null;

    switch (viewType) {
      case "line":
        return (
          <LineRenderer
            chartData={chartData}
            visibleMetrics={visibleMetrics}
            isFocused={isFocused}
          />
        );
      case "bar":
        return (
          <BarRenderer
            chartData={chartData}
            visibleMetrics={visibleMetrics}
            isFocused={isFocused}
          />
        );
      case "area":
        return (
          <AreaRenderer
            chartData={chartData}
            visibleMetrics={visibleMetrics}
            isFocused={isFocused}
          />
        );
      case "pie":
        return <PieRenderer pieData={pieData} />;
      case "scatter":
        return (
          <ScatterRenderer
            chartData={chartData}
            visibleMetrics={visibleMetrics}
            isFocused={isFocused}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full flex-1 min-h-0 bg-[#070707] rounded-3xl p-4 sm:p-6 relative group flex flex-col gap-4 sm:gap-6">
      {/* Precision Scale Toggle */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: Tooltip triggering container */}
      <div
        className="absolute top-4 right-4 sm:right-6 z-10 flex items-center gap-3"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div className="flex flex-col items-end gap-0.5">
          <label
            htmlFor="focused-scale-toggle"
            className="text-[7px] font-bold text-zinc-600 uppercase tracking-[0.4em] opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {isFocused ? "Precision" : "Standard"}
          </label>
          <span className="hidden sm:block text-[6px] font-bold text-zinc-800 uppercase tracking-[0.5em] opacity-0 group-hover:opacity-100 transition-opacity">
            Scale Protocol
          </span>
        </div>
        <button
          id="focused-scale-toggle"
          type="button"
          onClick={() => setIsFocused(!isFocused)}
          className={`
            w-9 h-4.5 sm:w-10 sm:h-5 rounded-full p-0.5 sm:p-1 transition-all duration-300 relative border
            ${isFocused ? "bg-brand/10 border-brand/40 shadow-[0_0_15px_rgba(139,92,246,0.1)]" : "bg-zinc-900 border-white/5"}
          `}
        >
          <div
            className={`
              w-3 h-3 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-500 ease-out
              ${isFocused ? "translate-x-4.5 sm:translate-x-5 bg-brand shadow-[0_0_10px_rgba(139,92,246,0.6)]" : "translate-x-0 bg-zinc-700"}
            `}
          />
        </button>

        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-10 right-0 w-48 sm:w-56 p-4 bg-black/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl z-20 pointer-events-none"
            >
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-brand/10 border border-brand/20 rounded-lg shrink-0">
                  <Info className="w-3 h-3 text-brand" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[8px] font-bold text-white uppercase tracking-widest">
                    Precision Protocol
                  </span>
                  <p className="text-[9px] leading-relaxed text-zinc-500 font-sans uppercase tracking-[0.1em] font-medium">
                    Dynamically adjusts Y-axis to highlight subtle temporal trends within the
                    current data range.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chart Canvas */}
      <div className="flex-1 min-h-[220px] sm:min-h-[320px] w-full min-w-0 relative">
        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            {renderContent()}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Interactive Legend (Composite Only) */}
      {dataset.type === "composite" && dataset.metrics && dataset.metrics.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-1 border-t border-white/5 pt-3 sm:gap-2 sm:px-2 sm:pt-4">
          {dataset.metrics.map((metric, i) => {
            const isVisible = visibleMetricIds.has(metric.id);
            const color = COLORS[i % COLORS.length];
            return (
              <button
                key={metric.id}
                type="button"
                onClick={() => toggleMetricVisibility(metric.id)}
                className={`
                  flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-full border text-[8px] sm:text-[10px] font-sans font-bold uppercase tracking-wider transition-all duration-200 active:scale-95 cursor-pointer
                  ${
                    isVisible
                      ? "bg-zinc-900 border-white/10 text-white shadow-[0_0_10px_rgba(255,255,255,0.02)]"
                      : "bg-black/20 border-white/5 text-zinc-600 hover:text-zinc-400"
                  }
                `}
              >
                <div
                  className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full shrink-0 transition-opacity"
                  style={{
                    backgroundColor: color,
                    opacity: isVisible ? 1 : 0.3,
                  }}
                />
                <span>
                  {metric.name} ({metric.unit.symbol || metric.unit.name})
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
