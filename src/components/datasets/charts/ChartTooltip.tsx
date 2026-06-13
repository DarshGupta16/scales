import type { Metric } from "../../../types/dataset";
import type { ChartData } from "./types";
import { COLORS } from "./types";

interface TooltipPayload {
  payload: ChartData;
  value: number | string;
}

export const CustomTooltip = ({
  active,
  payload,
  visibleMetrics,
  isMinimal = false,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  visibleMetrics: Metric[];
  isMinimal?: boolean;
}) => {
  if (active && payload && payload.length > 0) {
    const firstPayload = payload[0];
    if (firstPayload?.payload) {
      const data = firstPayload.payload;

      if (isMinimal) {
        return (
          <div className="bg-zinc-900 border border-white/20 p-2 rounded-lg shadow-xl pointer-events-none flex flex-col gap-1 min-w-[130px] z-50">
            <p className="text-[7px] font-bold text-zinc-500 uppercase tracking-wider leading-none mb-0.5 border-b border-white/5 pb-1">
              {data.displayDate}
            </p>
            <div className="flex flex-col gap-0.5">
              {visibleMetrics.map((metric, i) => {
                const val = data[metric.id];
                const displayVal = typeof val === "number" || typeof val === "string" ? val : "—";
                const dotColor = COLORS[i % COLORS.length];

                return (
                  <div key={metric.id} className="flex items-center justify-between gap-3">
                    <span className="text-[7px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1 truncate max-w-[80px]">
                      <div
                        className="w-1 h-1 rounded-full shrink-0"
                        style={{ backgroundColor: dotColor }}
                      />
                      <span className="truncate">{metric.name}</span>
                    </span>
                    <span className="text-[10px] font-display font-black text-white shrink-0">
                      {displayVal}{" "}
                      <span className="text-white/40 text-[7px] font-normal lowercase ml-0.5">
                        {metric.unit.symbol || metric.unit.name}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      return (
        <div className="bg-zinc-900/95 backdrop-blur-md p-2.5 sm:p-4 border border-white/10 rounded-xl sm:rounded-2xl shadow-2xl flex flex-col gap-1.5 sm:gap-2 min-w-[150px] sm:min-w-48 max-w-[240px] sm:max-w-xs">
          <p className="text-[8px] sm:text-[9px] font-bold text-zinc-500 uppercase tracking-[0.2em] border-b border-white/5 pb-1 sm:pb-1.5 mb-0.5">
            {data.displayDate}
          </p>
          <div className="flex flex-col gap-1 sm:gap-2">
            {visibleMetrics.map((metric) => {
              const val = data[metric.id];
              const displayVal = typeof val === "number" || typeof val === "string" ? val : "—";
              const metricIndex = visibleMetrics.findIndex((m) => m.id === metric.id);
              const dotColor = COLORS[metricIndex % COLORS.length];

              return (
                <div key={metric.id} className="flex items-center justify-between gap-4 sm:gap-6">
                  <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1 sm:gap-1.5 truncate max-w-[100px] sm:max-w-none">
                    <div
                      className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: dotColor }}
                    />
                    <span className="truncate">{metric.name}</span>
                  </span>
                  <span className="text-xs sm:text-sm font-display font-extrabold text-white shrink-0">
                    {displayVal}{" "}
                    <span className="text-white/40 text-[8px] sm:text-[9px] font-normal lowercase tracking-wider ml-0.5">
                      {metric.unit.symbol || metric.unit.name}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
  }
  return null;
};
