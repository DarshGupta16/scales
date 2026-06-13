import { Bar, BarChart, Tooltip } from "recharts";
import type { Metric } from "../../../types/dataset";
import { CommonGrid, CommonXAxis, CommonYAxis } from "./ChartAxes";
import { CustomTooltip } from "./ChartTooltip";
import type { ChartData } from "./types";
import { COLORS } from "./types";

export const BarRenderer = ({
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
      <BarChart data={chartData}>
        <CommonXAxis chartData={chartData} hide />
        <Tooltip
          content={<CustomTooltip visibleMetrics={visibleMetrics} isMinimal />}
          cursor={{ fill: "rgba(255, 255, 255, 0.03)" }}
          isAnimationActive={false}
        />
        {visibleMetrics.map((metric, i) => (
          <Bar
            key={metric.id}
            dataKey={metric.id}
            fill={COLORS[i % COLORS.length]}
            radius={[3, 3, 0, 0]}
            isAnimationActive={false}
          />
        ))}
      </BarChart>
    );
  }

  return (
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
};
