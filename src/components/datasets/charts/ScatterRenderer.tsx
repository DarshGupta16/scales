import { Scatter, ScatterChart, Tooltip } from "recharts";
import type { Metric } from "../../../types/dataset";
import { CommonGrid, CommonXAxis, CommonYAxis } from "./ChartAxes";
import { CustomTooltip } from "./ChartTooltip";
import type { ChartData } from "./types";
import { COLORS } from "./types";

export const ScatterRenderer = ({
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
