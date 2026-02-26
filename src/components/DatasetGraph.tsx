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

const COLORS = ["#ccff00", "#ff3333", "#0055ff", "#ffffff", "#888888"];

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
        <div className="bg-black p-4 border-2 border-white brutal-shadow-brand">
          <p className="text-xs font-bold text-zinc-500 mb-2 uppercase tracking-widest">{label}</p>
          <p className="text-2xl font-display font-extrabold text-brand uppercase">
            {payload[0].value} <span className="text-white text-sm tracking-widest">{unit}</span>
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

  const xAxis = <XAxis dataKey="displayDate" stroke="#888" tick={{ fill: '#fff', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickLine={{ stroke: '#fff' }} axisLine={{ stroke: '#fff', strokeWidth: 2 }} />;
  const yAxis = <YAxis stroke="#888" tick={{ fill: '#fff', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickLine={{ stroke: '#fff' }} axisLine={{ stroke: '#fff', strokeWidth: 2 }} />;
  const cartesianGrid = <CartesianGrid strokeDasharray="0" vertical={true} stroke="#333" strokeWidth={1} />;
  const tooltip = <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#fff', strokeWidth: 1, strokeDasharray: '4 4' }} />;

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
              type="step"
              dataKey="value"
              stroke="#ccff00"
              strokeWidth={4}
              dot={{ r: 0, fill: "#000", strokeWidth: 2, stroke: "#ccff00" }}
              activeDot={{ r: 8, strokeWidth: 2, stroke: "#fff", fill: "#000" }}
              animationDuration={0}
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
              fill="#ccff00"
              animationDuration={0}
            />
          </BarChart>
        );
      case "area":
        return (
          <AreaChart {...commonProps}>
            <defs>
              <pattern id="diagonalHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="8" stroke="#ccff00" strokeWidth="2" />
              </pattern>
            </defs>
            {cartesianGrid}
            {xAxis}
            {yAxis}
            {tooltip}
            <Area
              type="step"
              dataKey="value"
              stroke="#ccff00"
              strokeWidth={4}
              fillOpacity={1}
              fill="url(#diagonalHatch)"
              animationDuration={0}
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
              innerRadius={0}
              outerRadius={120}
              paddingAngle={0}
              dataKey="value"
              animationDuration={0}
              stroke="#000"
              strokeWidth={2}
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
            <XAxis type="category" dataKey="displayDate" name="Time" stroke="#fff" tick={{ fill: '#fff', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
            <YAxis type="number" dataKey="value" name="Value" stroke="#fff" tick={{ fill: '#fff', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
            {tooltip}
            <Scatter
              name="Measurements"
              data={chartData}
              fill="#ccff00"
              shape="square"
              animationDuration={0}
            />
          </ScatterChart>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full min-h-[400px] min-w-0 bg-[#0a0a0a] border-2 border-[#333] p-4 relative">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}
