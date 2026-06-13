import { Cell, Pie, PieChart, Tooltip } from "recharts";
import { COLORS } from "./types";

export interface PieDataPoint {
  name: string;
  value: number;
  unit: string;
  displayDate: string;
  tooltipId: string;
  colorIndex?: number;
}

export const PieRenderer = ({ pieData }: { pieData: PieDataPoint[] }) => (
  <PieChart>
    <Pie
      data={pieData}
      cx="50%"
      cy="50%"
      innerRadius={80}
      outerRadius={120}
      paddingAngle={8}
      dataKey="value"
      nameKey="name"
      animationDuration={1500}
      stroke="none"
      cornerRadius={10}
    >
      {pieData.map((entry, index) => (
        <Cell key={`cell-${entry.tooltipId || index}`} fill={COLORS[index % COLORS.length]} />
      ))}
    </Pie>
    <Tooltip
      content={({ active, payload }) => {
        if (active && payload && payload.length > 0) {
          const entry = payload[0].payload;
          return (
            <div className="bg-zinc-900/95 backdrop-blur-md p-4 border border-white/10 rounded-2xl shadow-2xl flex flex-col gap-1 min-w-48">
              {entry.displayDate && (
                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 border-b border-white/5 pb-1">
                  Latest: {entry.displayDate}
                </p>
              )}
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                {entry.name}
              </span>
              <span className="text-xl font-display font-extrabold text-white">
                {entry.value}{" "}
                <span className="text-white/40 text-xs font-normal lowercase tracking-wider ml-1">
                  {entry.unit}
                </span>
              </span>
            </div>
          );
        }
        return null;
      }}
    />
  </PieChart>
);
