import { Area, AreaChart, Tooltip } from "recharts";
import type { Metric } from "../../../types/dataset";
import { CommonGrid, CommonXAxis, CommonYAxis } from "./ChartAxes";
import { CustomTooltip } from "./ChartTooltip";
import type { ChartData } from "./types";
import { COLORS } from "./types";

export const AreaRenderer = ({
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
      <AreaChart data={chartData}>
        <defs>
          {visibleMetrics.map((metric, i) => {
            const color = COLORS[i % COLORS.length];
            return (
              <linearGradient
                key={metric.id}
                id={`grad-minimal-${metric.id}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            );
          })}
        </defs>
        <CommonXAxis chartData={chartData} hide />
        <Tooltip
          content={<CustomTooltip visibleMetrics={visibleMetrics} isMinimal />}
          cursor={{ stroke: "rgba(139, 92, 246, 0.1)", strokeWidth: 1.5 }}
          isAnimationActive={false}
        />
        {visibleMetrics.map((metric, i) => (
          <Area
            key={metric.id}
            type="monotone"
            dataKey={metric.id}
            stroke={COLORS[i % COLORS.length]}
            fill={`url(#grad-minimal-${metric.id})`}
            strokeWidth={1.5}
            isAnimationActive={false}
          />
        ))}
      </AreaChart>
    );
  }

  return (
    <AreaChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
      <defs>
        {visibleMetrics.map((metric, i) => {
          const color = COLORS[i % COLORS.length];
          return (
            <linearGradient key={metric.id} id={`color-${metric.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          );
        })}
      </defs>
      <CommonGrid />
      <CommonXAxis chartData={chartData} />
      <CommonYAxis isFocused={isFocused} />
      <Tooltip
        content={<CustomTooltip visibleMetrics={visibleMetrics} />}
        cursor={{ stroke: "rgba(139, 92, 246, 0.2)", strokeWidth: 2 }}
      />
      {visibleMetrics.map((metric, i) => (
        <Area
          key={metric.id}
          type="monotone"
          dataKey={metric.id}
          stroke={COLORS[i % COLORS.length]}
          strokeWidth={3}
          fillOpacity={1}
          fill={`url(#color-${metric.id})`}
          animationDuration={1500}
        />
      ))}
    </AreaChart>
  );
};
