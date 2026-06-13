import { CartesianGrid, XAxis, YAxis } from "recharts";
import type { ChartData } from "./types";

export const CommonXAxis = ({
  chartData,
  hide = false,
}: {
  chartData?: ChartData[];
  hide?: boolean;
}) => (
  <XAxis
    dataKey="tooltipId"
    tickFormatter={(_, index) => (chartData ? (chartData[index]?.displayDate ?? "") : "")}
    stroke="rgba(255,255,255,0.1)"
    tick={{
      fill: "rgba(255,255,255,0.4)",
      fontSize: 10,
      fontFamily: "JetBrains Mono",
    }}
    tickLine={false}
    axisLine={false}
    padding={{ left: 16, right: 16 }}
    tickMargin={8}
    hide={hide}
  />
);

export const CommonYAxis = ({ isFocused }: { isFocused: boolean }) => (
  <YAxis
    width={35}
    domain={isFocused ? ["auto", "auto"] : [0, "auto"]}
    stroke="rgba(255,255,255,0.1)"
    tick={{
      fill: "rgba(255,255,255,0.4)",
      fontSize: 10,
      fontFamily: "JetBrains Mono",
    }}
    tickLine={false}
    axisLine={false}
    tickMargin={8}
  />
);

export const CommonGrid = () => (
  <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="rgba(255,255,255,0.05)" />
);
