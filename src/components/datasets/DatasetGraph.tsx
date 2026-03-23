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
import type { Measurement, ViewType } from "../../types/dataset";
import { formatDate } from "../../utils/format";

interface DatasetGraphProps {
  data: Measurement[];
  viewType: ViewType;
  unit: string;
}

interface ChartData extends Measurement {
  tooltipId: string;
  displayDate: string;
}

const COLORS = ["#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe"];

interface TooltipPayload {
  payload: ChartData;
  value: number | string;
}

const CustomTooltip = ({
  active,
  payload,
  unit,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  unit: string;
}) => {
  if (active && payload && payload.length > 0) {
    const firstPayload = payload[0];
    if (firstPayload?.payload) {
      const data = firstPayload.payload;
      return (
        <div className="bg-zinc-900/90 backdrop-blur-md p-4 border border-white/10 rounded-2xl shadow-2xl">
          <p className="text-[10px] font-bold text-zinc-500 mb-2 uppercase tracking-[0.2em]">
            {data.displayDate}
          </p>
          <p className="text-xl font-display font-extrabold text-brand uppercase">
            {firstPayload.value}{" "}
            <span className="text-white/50 text-xs tracking-widest">{unit}</span>
          </p>
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
  />
);

const CommonYAxis = ({ isFocused }: { isFocused: boolean }) => (
  <YAxis
    domain={isFocused ? ["auto", "auto"] : [0, "auto"]}
    stroke="rgba(255,255,255,0.1)"
    tick={{
      fill: "rgba(255,255,255,0.4)",
      fontSize: 10,
      fontFamily: "JetBrains Mono",
    }}
    tickLine={false}
    axisLine={false}
  />
);

const CommonGrid = () => (
  <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="rgba(255,255,255,0.05)" />
);

const CommonTooltip = ({ unit }: { unit: string }) => (
  <Tooltip
    content={<CustomTooltip unit={unit} />}
    cursor={{ stroke: "rgba(139, 92, 246, 0.2)", strokeWidth: 2 }}
  />
);

// Modular Chart Renderers
const LineRenderer = ({
  chartData,
  unit,
  isFocused,
}: {
  chartData: ChartData[];
  unit: string;
  isFocused: boolean;
}) => (
  <LineChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
    <CommonGrid />
    <CommonXAxis chartData={chartData} />
    <CommonYAxis isFocused={isFocused} />
    <CommonTooltip unit={unit} />
    <Line
      type="monotone"
      dataKey="value"
      stroke="#8b5cf6"
      strokeWidth={3}
      dot={{ r: 4, fill: "#8b5cf6", strokeWidth: 2, stroke: "#000" }}
      activeDot={{ r: 6, strokeWidth: 3, stroke: "#fff", fill: "#8b5cf6" }}
      animationDuration={1500}
    />
  </LineChart>
);

const BarRenderer = ({
  chartData,
  unit,
  isFocused,
}: {
  chartData: ChartData[];
  unit: string;
  isFocused: boolean;
}) => (
  <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
    <CommonGrid />
    <CommonXAxis chartData={chartData} />
    <CommonYAxis isFocused={isFocused} />
    <CommonTooltip unit={unit} />
    <Bar dataKey="value" fill="#8b5cf6" radius={[10, 10, 0, 0]} animationDuration={1500} />
  </BarChart>
);

const AreaRenderer = ({
  chartData,
  unit,
  isFocused,
}: {
  chartData: ChartData[];
  unit: string;
  isFocused: boolean;
}) => (
  <AreaChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
    <defs>
      <linearGradient id="colorMain" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
      </linearGradient>
    </defs>
    <CommonGrid />
    <CommonXAxis chartData={chartData} />
    <CommonYAxis isFocused={isFocused} />
    <CommonTooltip unit={unit} />
    <Area
      type="monotone"
      dataKey="value"
      stroke="#8b5cf6"
      strokeWidth={3}
      fillOpacity={1}
      fill="url(#colorMain)"
      animationDuration={1500}
    />
  </AreaChart>
);

const PieRenderer = ({ chartData, unit }: { chartData: ChartData[]; unit: string }) => (
  <PieChart>
    <Pie
      data={chartData}
      cx="50%"
      cy="50%"
      innerRadius={80}
      outerRadius={120}
      paddingAngle={8}
      dataKey="value"
      animationDuration={1500}
      stroke="none"
      cornerRadius={10}
    >
      {chartData.map((entry) => (
        <Cell
          key={`cell-${entry.tooltipId}`}
          fill={COLORS[chartData.indexOf(entry) % COLORS.length]}
        />
      ))}
    </Pie>
    <CommonTooltip unit={unit} />
  </PieChart>
);

const ScatterRenderer = ({
  chartData,
  unit,
  isFocused,
}: {
  chartData: ChartData[];
  unit: string;
  isFocused: boolean;
}) => (
  <ScatterChart margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
    <CommonGrid />
    <CommonXAxis chartData={chartData} />
    <CommonYAxis isFocused={isFocused} />
    <CommonTooltip unit={unit} />
    <Scatter name="Measurements" data={chartData} fill="#8b5cf6" animationDuration={1500} />
  </ScatterChart>
);

export function DatasetGraph({ data, viewType, unit }: DatasetGraphProps) {
  const [isClient, setIsClient] = useState(false);
  const [isFocused, setIsFocused] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const chartData = useMemo<ChartData[]>(() => {
    const sortedData = [...data].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
    return sortedData.map((m, index) => ({
      ...m,
      tooltipId: `${m.id || index.toString()}-${m.timestamp}`,
      displayDate: isClient ? formatDate(m.timestamp, "full") : "",
    }));
  }, [data, isClient]);

  const renderContent = () => {
    if (!isClient) return null;

    switch (viewType) {
      case "line":
        return <LineRenderer chartData={chartData} unit={unit} isFocused={isFocused} />;
      case "bar":
        return <BarRenderer chartData={chartData} unit={unit} isFocused={isFocused} />;
      case "area":
        return <AreaRenderer chartData={chartData} unit={unit} isFocused={isFocused} />;
      case "pie":
        return <PieRenderer chartData={chartData} unit={unit} />;
      case "scatter":
        return <ScatterRenderer chartData={chartData} unit={unit} isFocused={isFocused} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full h-75 sm:h-100 min-w-0 bg-[#070707] rounded-3xl p-2 sm:p-6 relative group">
      {/* Focused Scale Toggle */}
      <div
        className="absolute top-4 right-6 z-10 flex items-center gap-3"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <label
          htmlFor="focused-scale-toggle"
          className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {isFocused ? "Precision Focus" : "Standard Scale"}
        </label>
        <button
          id="focused-scale-toggle"
          type="button"
          onClick={() => setIsFocused(!isFocused)}
          className={`
            w-10 h-5 rounded-full p-1 transition-colors duration-300 relative
            ${isFocused ? "bg-brand/20 border border-brand/50" : "bg-zinc-800 border border-white/10"}
          `}
        >
          <div
            className={`
              w-2.5 h-2.5 rounded-full transition-all duration-300
              ${isFocused ? "translate-x-5 bg-brand shadow-[0_0_8px_rgba(139,92,246,0.5)]" : "translate-x-0 bg-zinc-500"}
            `}
          />
        </button>

        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-10 right-0 w-56 p-4 bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-20 pointer-events-none"
            >
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-brand/10 border border-brand/20 rounded-lg">
                  <Info className="w-3 h-3 text-brand" />
                </div>
                <p className="text-[10px] leading-relaxed text-zinc-400 font-sans uppercase tracking-[0.15em] font-medium">
                  Precision Focus dynamically adjusts the Y-axis to highlight subtle temporal trends
                  within your data range.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        {renderContent()}
      </ResponsiveContainer>
    </div>
  );
}
