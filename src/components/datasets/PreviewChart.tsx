import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import type { Dataset, Measurement } from "../../types/dataset";

interface PreviewData extends Measurement {
  tooltipId: string;
  displayDate: string;
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { value: number; payload: PreviewData }[];
}) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    return (
      <div className="bg-zinc-900 border border-white/20 p-2 rounded-lg shadow-xl pointer-events-none">
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider leading-none mb-1">
          {data.displayDate}
        </p>
        <p className="text-sm font-display font-black text-brand leading-none">
          {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

export default function PreviewChart({ dataset, data }: { dataset: Dataset; data: PreviewData[] }) {
  const viewType = dataset.views[0] ?? "line";
  const commonAxis = <XAxis dataKey="tooltipId" hide />;
  const tooltip = (
    <Tooltip
      content={<CustomTooltip />}
      cursor={{ stroke: "rgba(139, 92, 246, 0.2)", strokeWidth: 2 }}
      isAnimationActive={false}
    />
  );

  return (
    <ResponsiveContainer width="100%" height="100%">
      {(() => {
        switch (viewType) {
          case "area":
            return (
              <AreaChart data={data}>
                <defs>
                  <linearGradient id={`grad-${dataset.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                {commonAxis}
                {tooltip}
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#8b5cf6"
                  fill={`url(#grad-${dataset.id})`}
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              </AreaChart>
            );
          case "bar":
            return (
              <BarChart data={data}>
                {commonAxis}
                {tooltip}
                <Bar
                  dataKey="value"
                  fill="#8b5cf6"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            );
          default:
            return (
              <LineChart data={data}>
                {commonAxis}
                {tooltip}
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#8b5cf6"
                  strokeWidth={2.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            );
        }
      })()}
    </ResponsiveContainer>
  );
}
