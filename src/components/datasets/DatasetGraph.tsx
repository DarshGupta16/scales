import { AnimatePresence, motion } from "framer-motion";
import { Info } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  Dataset,
  Measurement,
  MeasurementValue,
  Metric,
  UnitRecord,
  ViewType,
} from "../../types/dataset";
import { formatDate } from "../../utils/format";

interface DatasetGraphProps {
  dataset: Dataset;
  data: Measurement[];
  viewType: ViewType;
}

interface ChartData extends Measurement {
  tooltipId: string;
  displayDate: string;
  value: number; // Fallback for single metric charts
  [key: string]: string | number | MeasurementValue[] | undefined;
}

const COLORS = [
  "#8b5cf6", // Violet-500 (Brand)
  "#06b6d4", // Cyan-500
  "#10b981", // Emerald-500
  "#ec4899", // Pink-500
  "#f59e0b", // Amber-500
  "#3b82f6", // Blue-500
  "#a78bfa", // Lavender-400
];

const UNKNOWN_UNIT: UnitRecord = {
  id: "unknown",
  name: "Unknown",
  symbol: "?",
  created: 0,
  updated: 0,
};

interface TooltipPayload {
  payload: ChartData;
  value: number | string;
}

const CustomTooltip = ({
  active,
  payload,
  visibleMetrics,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  visibleMetrics: Metric[];
}) => {
  if (active && payload && payload.length > 0) {
    const firstPayload = payload[0];
    if (firstPayload?.payload) {
      const data = firstPayload.payload;
      return (
        <div className="bg-zinc-900/95 backdrop-blur-md p-2.5 sm:p-4 border border-white/10 rounded-xl sm:rounded-2xl shadow-2xl flex flex-col gap-1.5 sm:gap-2 min-w-[150px] sm:min-w-48 max-w-[240px] sm:max-w-xs">
          <p className="text-[8px] sm:text-[9px] font-bold text-zinc-500 uppercase tracking-[0.2em] border-b border-white/5 pb-1 sm:pb-1.5 mb-0.5">
            {data.displayDate}
          </p>
          <div className="flex flex-col gap-1 sm:gap-2">
            {visibleMetrics.map((metric) => {
              const val = data[metric.id];
              const displayVal = typeof val === "number" || typeof val === "string" ? val : "—";
              const metricIndex = visibleMetrics.findIndex((m) => m.id === metric.id);
              const dotColor = COLORS[metricIndex % COLORS.length];

              return (
                <div key={metric.id} className="flex items-center justify-between gap-4 sm:gap-6">
                  <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1 sm:gap-1.5 truncate max-w-[100px] sm:max-w-none">
                    <div
                      className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: dotColor }}
                    />
                    <span className="truncate">{metric.name}</span>
                  </span>
                  <span className="text-xs sm:text-sm font-display font-extrabold text-white shrink-0">
                    {displayVal}{" "}
                    <span className="text-white/40 text-[8px] sm:text-[9px] font-normal lowercase tracking-wider ml-0.5">
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
  }
  return null;
};

// Reusable Chart Elements
const CommonXAxis = ({ chartData }: { chartData: ChartData[] }) => (
  <XAxis
    dataKey="tooltipId"
    tickFormatter={(_, index) => chartData[index]?.displayDate ?? ""}
    stroke="rgba(255,255,255,0.1)"
    tick={{
      fill: "rgba(255,255,255,0.4)",
      fontSize: 10,
      fontFamily: "JetBrains Mono",
    }}
    tickLine={false}
    axisLine={false}
    padding={{ left: 16, right: 16 }}
    tickMargin={8}
  />
);

const CommonYAxis = ({ isFocused }: { isFocused: boolean }) => (
  <YAxis
    width={35}
    domain={isFocused ? ["auto", "auto"] : [0, "auto"]}
    stroke="rgba(255,255,255,0.1)"
    tick={{
      fill: "rgba(255,255,255,0.4)",
      fontSize: 10,
      fontFamily: "JetBrains Mono",
    }}
    tickLine={false}
    axisLine={false}
    tickMargin={8}
  />
);

const CommonGrid = () => (
  <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="rgba(255,255,255,0.05)" />
);

// Modular Chart Renderers
const LineRenderer = ({
  chartData,
  visibleMetrics,
  isFocused,
}: {
  chartData: ChartData[];
  visibleMetrics: Metric[];
  isFocused: boolean;
}) => (
  <LineChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
    <CommonGrid />
    <CommonXAxis chartData={chartData} />
    <CommonYAxis isFocused={isFocused} />
    <Tooltip
      content={<CustomTooltip visibleMetrics={visibleMetrics} />}
      cursor={{ stroke: "rgba(139, 92, 246, 0.2)", strokeWidth: 2 }}
    />
    {visibleMetrics.map((metric, i) => (
      <Line
        key={metric.id}
        type="monotone"
        dataKey={metric.id}
        stroke={COLORS[i % COLORS.length]}
        strokeWidth={3}
        dot={{ r: 4, fill: COLORS[i % COLORS.length], strokeWidth: 2, stroke: "#000" }}
        activeDot={{ r: 6, strokeWidth: 3, stroke: "#fff", fill: COLORS[i % COLORS.length] }}
        animationDuration={1500}
      />
    ))}
  </LineChart>
);

const BarRenderer = ({
  chartData,
  visibleMetrics,
  isFocused,
}: {
  chartData: ChartData[];
  visibleMetrics: Metric[];
  isFocused: boolean;
}) => (
  <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
    <CommonGrid />
    <CommonXAxis chartData={chartData} />
    <CommonYAxis isFocused={isFocused} />
    <Tooltip
      content={<CustomTooltip visibleMetrics={visibleMetrics} />}
      cursor={{ fill: "rgba(255, 255, 255, 0.03)" }}
    />
    {visibleMetrics.map((metric, i) => (
      <Bar
        key={metric.id}
        dataKey={metric.id}
        fill={COLORS[i % COLORS.length]}
        radius={[6, 6, 0, 0]}
        animationDuration={1500}
      />
    ))}
  </BarChart>
);

const AreaRenderer = ({
  chartData,
  visibleMetrics,
  isFocused,
}: {
  chartData: ChartData[];
  visibleMetrics: Metric[];
  isFocused: boolean;
}) => (
  <AreaChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
    <defs>
      {visibleMetrics.map((metric, i) => {
        const color = COLORS[i % COLORS.length];
        return (
          <linearGradient key={metric.id} id={`color-${metric.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        );
      })}
    </defs>
    <CommonGrid />
    <CommonXAxis chartData={chartData} />
    <CommonYAxis isFocused={isFocused} />
    <Tooltip
      content={<CustomTooltip visibleMetrics={visibleMetrics} />}
      cursor={{ stroke: "rgba(139, 92, 246, 0.2)", strokeWidth: 2 }}
    />
    {visibleMetrics.map((metric, i) => (
      <Area
        key={metric.id}
        type="monotone"
        dataKey={metric.id}
        stroke={COLORS[i % COLORS.length]}
        strokeWidth={3}
        fillOpacity={1}
        fill={`url(#color-${metric.id})`}
        animationDuration={1500}
      />
    ))}
  </AreaChart>
);

interface PieDataPoint {
  name: string;
  value: number;
  unit: string;
  displayDate: string;
  tooltipId: string;
  colorIndex?: number;
}

const PieRenderer = ({ pieData }: { pieData: PieDataPoint[] }) => (
  <PieChart>
    <Pie
      data={pieData}
      cx="50%"
      cy="50%"
      innerRadius={80}
      outerRadius={120}
      paddingAngle={8}
      dataKey="value"
      nameKey="name"
      animationDuration={1500}
      stroke="none"
      cornerRadius={10}
    >
      {pieData.map((entry, index) => (
        <Cell key={`cell-${entry.tooltipId || index}`} fill={COLORS[index % COLORS.length]} />
      ))}
    </Pie>
    <Tooltip
      content={({ active, payload }) => {
        if (active && payload && payload.length > 0) {
          const entry = payload[0].payload;
          return (
            <div className="bg-zinc-900/95 backdrop-blur-md p-4 border border-white/10 rounded-2xl shadow-2xl flex flex-col gap-1 min-w-48">
              {entry.displayDate && (
                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 border-b border-white/5 pb-1">
                  Latest: {entry.displayDate}
                </p>
              )}
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                {entry.name}
              </span>
              <span className="text-xl font-display font-extrabold text-white">
                {entry.value}{" "}
                <span className="text-white/40 text-xs font-normal lowercase tracking-wider ml-1">
                  {entry.unit}
                </span>
              </span>
            </div>
          );
        }
        return null;
      }}
    />
  </PieChart>
);

const ScatterRenderer = ({
  chartData,
  visibleMetrics,
  isFocused,
}: {
  chartData: ChartData[];
  visibleMetrics: Metric[];
  isFocused: boolean;
}) => (
  <ScatterChart margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
    <CommonGrid />
    <CommonXAxis chartData={chartData} />
    <CommonYAxis isFocused={isFocused} />
    <Tooltip
      content={<CustomTooltip visibleMetrics={visibleMetrics} />}
      cursor={{ stroke: "rgba(139, 92, 246, 0.2)", strokeWidth: 2 }}
    />
    {visibleMetrics.map((metric, i) => (
      <Scatter
        key={metric.id}
        name={metric.name}
        data={chartData}
        dataKey={metric.id}
        fill={COLORS[i % COLORS.length]}
        animationDuration={1500}
      />
    ))}
  </ScatterChart>
);

export function DatasetGraph({ dataset, data, viewType }: DatasetGraphProps) {
  const [isClient, setIsClient] = useState(false);
  const [isFocused, setIsFocused] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);

  // Track visible metric IDs locally for interactive legend toggles
  const [visibleMetricIds, setVisibleMetricIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize all metrics as visible when dataset changes
  useEffect(() => {
    if (dataset?.metrics) {
      setVisibleMetricIds(new Set(dataset.metrics.map((m) => m.id)));
    }
  }, [dataset]);

  const toggleMetricVisibility = (metricId: string) => {
    setVisibleMetricIds((prev) => {
      const next = new Set(prev);
      if (next.has(metricId)) {
        // Enforce that at least one metric remains visible
        if (next.size > 1) {
          next.delete(metricId);
        }
      } else {
        next.add(metricId);
      }
      return next;
    });
  };

  const visibleMetrics = useMemo(() => {
    return (dataset.metrics || []).filter((m) => visibleMetricIds.has(m.id));
  }, [dataset.metrics, visibleMetricIds]);

  const chartData = useMemo<ChartData[]>(() => {
    // Explicitly sort ascending (oldest first) for the chart flow
    const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);

    return sortedData.map((m, index) => {
      const dataPoint: ChartData = {
        ...m,
        value: m.values[0]?.value || 0, // Fallback for single metric charts
        tooltipId: `${m.id || index.toString()}-${m.timestamp}`,
        displayDate: isClient ? formatDate(m.timestamp, "full") : "",
      };

      // Map each metric value dynamically under its metricId
      for (const val of m.values) {
        dataPoint[val.metricId] = val.value;
      }

      return dataPoint;
    });
  }, [data, isClient]);

  const pieData = useMemo(() => {
    if (dataset.type === "composite") {
      // Find latest measurement
      const sortedData = [...data].sort((a, b) => b.timestamp - a.timestamp);
      const latest = sortedData[0];
      if (!latest) return [];

      return visibleMetrics.map((metric) => {
        const valRecord = latest.values.find((v) => v.metricId === metric.id);
        const metricIndex = (dataset.metrics || []).findIndex((m) => m.id === metric.id);
        return {
          name: metric.name,
          value: valRecord ? valRecord.value : 0,
          unit: metric.unit.symbol || metric.unit.name,
          displayDate: isClient ? formatDate(latest.timestamp, "full") : "",
          tooltipId: `pie-${metric.id}`,
          colorIndex: metricIndex,
        };
      });
    }

    // Single dataset: slices represent historical values
    return chartData.map((d) => ({
      name: d.displayDate,
      value: d.value,
      unit: dataset.unit?.symbol || dataset.unit?.name || UNKNOWN_UNIT.symbol,
      displayDate: d.displayDate,
      tooltipId: d.tooltipId,
    }));
  }, [dataset, data, visibleMetrics, chartData, isClient]);

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
