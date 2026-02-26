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
import { useMemo } from "react";

interface DatasetGraphProps {
  data: Measurement[];
  viewType: ViewType;
  unit: string;
}

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f59e0b", "#10b981"];

export function DatasetGraph({ data, viewType, unit }: DatasetGraphProps) {
  const chartData = useMemo(() => {
    return data.map((m) => ({
      ...m,
      displayDate: new Date(m.timestamp).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));
  }, [data]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-xl shadow-lg ring-1 ring-black/5">
          <p className="text-xs font-medium text-slate-400 mb-1">{label}</p>
          <p className="text-sm font-bold text-indigo-600">
            {payload[0].value} <span className="text-slate-500 font-normal uppercase text-[10px]">{unit}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const commonProps = {
    data: chartData,
    margin: { top: 10, right: 10, left: 0, bottom: 0 },
  };

  const xAxis = <XAxis dataKey="displayDate" hide />;
  const yAxis = <YAxis hide />;
  const cartesianGrid = <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />;
  const tooltip = <Tooltip content={<CustomTooltip />} />;

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
              stroke="#6366f1"
              strokeWidth={3}
              dot={{ r: 4, fill: "#6366f1", strokeWidth: 2, stroke: "#fff" }}
              activeDot={{ r: 6, strokeWidth: 0 }}
              animationDuration={1000}
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
              fill="#6366f1"
              radius={[6, 6, 0, 0]}
              animationDuration={1000}
            />
          </BarChart>
        );
      case "area":
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            {cartesianGrid}
            {xAxis}
            {yAxis}
            {tooltip}
            <Area
              type="monotone"
              dataKey="value"
              stroke="#6366f1"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorValue)"
              animationDuration={1000}
            />
          </AreaChart>
        );
      case "pie":
        return (
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              animationDuration={1000}
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            {tooltip}
          </PieChart>
        );
      case "scatter":
        return (
          <ScatterChart {...commonProps}>
            {cartesianGrid}
            <XAxis type="category" dataKey="displayDate" name="Time" hide />
            <YAxis type="number" dataKey="value" name="Value" hide />
            {tooltip}
            <Scatter
              name="Measurements"
              data={chartData}
              fill="#6366f1"
              animationDuration={1000}
            />
          </ScatterChart>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full min-h-[300px] min-w-0">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}
