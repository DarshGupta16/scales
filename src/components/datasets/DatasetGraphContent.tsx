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

const CommonYAxis = () => (
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

const CommonGrid = () => (
  <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="rgba(255,255,255,0.05)" />
);

const CommonTooltip = ({ unit }: { unit: string }) => (
  <Tooltip
    content={<CustomTooltip unit={unit} />}
    cursor={{ stroke: "rgba(139, 92, 246, 0.2)", strokeWidth: 2 }}
  />
);

const LineRenderer = ({ chartData, unit }: { chartData: ChartData[]; unit: string }) => (
  <LineChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
    <CommonGrid />
    <CommonXAxis chartData={chartData} />
    <CommonYAxis />
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

const BarRenderer = ({ chartData, unit }: { chartData: ChartData[]; unit: string }) => (
  <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
    <CommonGrid />
    <CommonXAxis chartData={chartData} />
    <CommonYAxis />
    <CommonTooltip unit={unit} />
    <Bar dataKey="value" fill="#8b5cf6" radius={[10, 10, 0, 0]} animationDuration={1500} />
  </BarChart>
);

const AreaRenderer = ({ chartData, unit }: { chartData: ChartData[]; unit: string }) => (
  <AreaChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
    <defs>
      <linearGradient id="colorMain" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
      </linearGradient>
    </defs>
    <CommonGrid />
    <CommonXAxis chartData={chartData} />
    <CommonYAxis />
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

const ScatterRenderer = ({ chartData, unit }: { chartData: ChartData[]; unit: string }) => (
  <ScatterChart margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
    <CommonGrid />
    <CommonXAxis chartData={chartData} />
    <CommonYAxis />
    <CommonTooltip unit={unit} />
    <Scatter name="Measurements" data={chartData} fill="#8b5cf6" animationDuration={1500} />
  </ScatterChart>
);

export default function DatasetGraphContent({
  chartData,
  viewType,
  unit,
}: {
  chartData: ChartData[];
  viewType: ViewType;
  unit: string;
}) {
  const renderContent = () => {
    switch (viewType) {
      case "line":
        return <LineRenderer chartData={chartData} unit={unit} />;
      case "bar":
        return <BarRenderer chartData={chartData} unit={unit} />;
      case "area":
        return <AreaRenderer chartData={chartData} unit={unit} />;
      case "pie":
        return <PieRenderer chartData={chartData} unit={unit} />;
      case "scatter":
        return <ScatterRenderer chartData={chartData} unit={unit} />;
      default:
        return null;
    }
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      {renderContent()}
    </ResponsiveContainer>
  );
}
