import { Line, LineChart, Tooltip } from "recharts";
import type { Metric } from "../../../types/dataset";
import { CommonGrid, CommonXAxis, CommonYAxis } from "./ChartAxes";
import { CustomTooltip } from "./ChartTooltip";
import type { ChartData } from "./types";
import { COLORS } from "./types";

export const LineRenderer = ({
  chartData,
  visibleMetrics,
  isFocused,
  isMinimal = false,
}: {
  chartData: ChartData[];
  visibleMetrics: Metric[];
  isFocused: boolean;
  isMinimal?: boolean;
}) => {
  if (isMinimal) {
    return (
      <LineChart data={chartData}>
        <CommonXAxis chartData={chartData} hide />
        <Tooltip
          content={<CustomTooltip visibleMetrics={visibleMetrics} isMinimal />}
          cursor={{ stroke: "rgba(139, 92, 246, 0.1)", strokeWidth: 1.5 }}
          isAnimationActive={false}
        />
        {visibleMetrics.map((metric, i) => (
          <Line
            key={metric.id}
            type="monotone"
            dataKey={metric.id}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    );
  }

  return (
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
};
