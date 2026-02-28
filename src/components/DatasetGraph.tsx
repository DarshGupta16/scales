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

const COLORS = ["#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe"];

export function DatasetGraph({ data, viewType, unit }: DatasetGraphProps) {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const chartData = useMemo(() => {
    return data.map((m, index) => ({
      ...m,
      tooltipId: `${m.id || index}-${m.timestamp}`,
      displayDate: new Date(m.timestamp).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));
  }, [data]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900/90 backdrop-blur-md p-4 border border-white/10 rounded-2xl shadow-2xl">
          <p className="text-[10px] font-bold text-zinc-500 mb-2 uppercase tracking-[0.2em]">
            {payload[0].payload.displayDate}
          </p>
          <p className="text-xl font-display font-extrabold text-brand uppercase">
            {payload[0].value}{" "}
            <span className="text-white/50 text-xs tracking-widest">
              {unit}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  const commonProps = {
    data: chartData,
    margin: { top: 20, right: 20, left: 0, bottom: 0 },
  };

  const xAxis = (
    <XAxis
      dataKey="tooltipId"
             tickFormatter={(_value, index) => chartData[index]?.displayDate || ""}
      
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
  const yAxis = (
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
  const cartesianGrid = (
    <CartesianGrid
      strokeDasharray="5 5"
      vertical={false}
      stroke="rgba(255,255,255,0.05)"
    />
  );
  const tooltip = (
    <Tooltip
      content={<CustomTooltip />}
      cursor={{ stroke: "rgba(139, 92, 246, 0.2)", strokeWidth: 2 }}
    />
  );

  const renderChart = () => {
    switch (viewType) {
      case "line":
        return (
          <LineChart {...commonProps}>
            {cartesianGrid}
            {xAxis}
            {yAxis}
            {tooltip}
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
          </LineChart>
        );
      case "bar":
        return (
          <BarChart {...commonProps}>
            {cartesianGrid}
            {xAxis}
            {yAxis}
            {tooltip}
            <Bar
              dataKey="value"
              fill="#8b5cf6"
              radius={[10, 10, 0, 0]}
              animationDuration={1500}
            />
          </BarChart>
        );
      case "area":
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorMain" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            {cartesianGrid}
            {xAxis}
            {yAxis}
            {tooltip}
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
      case "pie":
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
            {tooltip}
          </PieChart>
        );
      case "scatter":
        return (
          <ScatterChart {...commonProps}>
            {cartesianGrid}
            {xAxis}
            {yAxis}
            {tooltip}
            <Scatter
              name="Measurements"
              data={chartData}
              fill="#8b5cf6"
              animationDuration={1500}
            />
          </ScatterChart>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full min-h-[400px] min-w-0 bg-[#070707] rounded-3xl p-6 relative">
      {isClient && (
        <ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={0}
          minHeight={0}
        >
          {renderChart()}
        </ResponsiveContainer>
      )}
    </div>
  );
}
