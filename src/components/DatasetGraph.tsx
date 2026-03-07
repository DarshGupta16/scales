import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { ViewType, Measurement } from "../types/dataset";
import { useMemo, useState, useEffect } from "react";

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
            <span className="text-white/50 text-xs tracking-widest">
              {unit}
            </span>
          </p>
        </div>
      );
    }
  }
  return null;
};

// Reusable Chart Elements
const renderXAxis = (chartData: ChartData[]) => (
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

const renderYAxis = () => (
  <YAxis
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

const renderCartesianGrid = () => (
  <CartesianGrid
    strokeDasharray="5 5"
    vertical={false}
    stroke="rgba(255,255,255,0.05)"
  />
);

const renderTooltip = (unit: string) => (
  <Tooltip
    content={<CustomTooltip unit={unit} />}
    cursor={{ stroke: "rgba(139, 92, 246, 0.2)", strokeWidth: 2 }}
  />
);

interface ChartRendererProps {
  viewType: ViewType;
  chartData: ChartData[];
  unit: string;
}

// Modular Chart Renderers
const ChartRenderer = ({ viewType, chartData, unit }: ChartRendererProps) => {
  const commonProps = {
    data: chartData,
    margin: { top: 20, right: 20, left: 0, bottom: 0 },
  };

  if (viewType === "pie") {
    return (
      <PieChart {...commonProps}>
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
          {chartData.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[index % COLORS.length]}
            />
          ))}
        </Pie>
        {renderTooltip(unit)}
      </PieChart>
    );
  }

  const ChartWrapper = {
    line: LineChart,
    bar: BarChart,
    area: AreaChart,
    scatter: ScatterChart,
  }[viewType];

  if (!ChartWrapper) return null;

  return (
    <ChartWrapper {...commonProps}>
      {viewType === "area" && (
        <defs>
          <linearGradient id="colorMain" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
          </linearGradient>
        </defs>
      )}
      {renderCartesianGrid()}
      {renderXAxis(chartData)}
      {renderYAxis()}
      {renderTooltip(unit)}
      
      {viewType === "line" && (
        <Line
          type="monotone"
          dataKey="value"
          stroke="#8b5cf6"
          strokeWidth={3}
          dot={{ r: 4, fill: "#8b5cf6", strokeWidth: 2, stroke: "#000" }}
          activeDot={{
            r: 6,
            strokeWidth: 3,
            stroke: "#fff",
            fill: "#8b5cf6",
          }}
          animationDuration={1500}
        />
      )}
      {viewType === "bar" && (
        <Bar
          dataKey="value"
          fill="#8b5cf6"
          radius={[10, 10, 0, 0]}
          animationDuration={1500}
        />
      )}
      {viewType === "area" && (
        <Area
          type="monotone"
          dataKey="value"
          stroke="#8b5cf6"
          strokeWidth={3}
          fillOpacity={1}
          fill="url(#colorMain)"
          animationDuration={1500}
        />
      )}
      {viewType === "scatter" && (
        <Scatter
          name="Measurements"
          data={chartData}
          fill="#8b5cf6"
          animationDuration={1500}
        />
      )}
    </ChartWrapper>
  );
};

export function DatasetGraph({ data, viewType, unit }: DatasetGraphProps) {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const chartData = useMemo<ChartData[]>(() => {
    return data.map((m, index) => ({
      ...m,
      tooltipId: `${m.id || index.toString()}-${m.timestamp}`,
      displayDate: isClient
        ? new Date(m.timestamp).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "",
    }));
  }, [data, isClient]);

  return (
    <div className="w-full h-[300px] sm:h-[400px] min-w-0 bg-[#070707] rounded-3xl p-2 sm:p-6 relative">
      {isClient && (
        <ResponsiveContainer width="100%" height="100%">
          <ChartRenderer
            viewType={viewType}
            chartData={chartData}
            unit={unit}
          />
        </ResponsiveContainer>
      )}
    </div>
  );
}
