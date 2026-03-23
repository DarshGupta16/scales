import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  Clock,
  Infinity as InfinityIcon,
  type LucideIcon,
  SlidersHorizontal,
} from "lucide-react";
import type { CustomRange, Timeline } from "../../types/dataset";

interface TimelineSelectorProps {
  activeTimeline: Timeline;
  onTimelineChange: (timeline: Timeline) => void;
  customRange: CustomRange;
  onCustomRangeChange: (range: CustomRange) => void;
}

export function TimelineSelector({
  activeTimeline,
  onTimelineChange,
  customRange,
  onCustomRangeChange,
}: TimelineSelectorProps) {
  const options: { id: Timeline; label: string; icon: LucideIcon }[] = [
    { id: "all", label: "Infinity", icon: InfinityIcon },
    { id: "week", label: "Septenary", icon: Calendar },
    { id: "day", label: "Circadian", icon: Clock },
    { id: "custom", label: "Arbitrary", icon: SlidersHorizontal },
  ];

  const getLocalDatetimeLocal = (timestamp: number) => {
    const d = new Date(timestamp);
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  };

  return (
    <div className="flex flex-col gap-6 w-full sm:w-fit">
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3 p-1 sm:p-1.5 bg-white/5 border border-white/10 rounded-2xl w-full sm:w-fit">
        {options.map((option) => {
          const isActive = activeTimeline === option.id;
          const Icon = option.icon;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onTimelineChange(option.id)}
              className={`
                relative flex items-center justify-center sm:justify-start gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all duration-300
                ${isActive ? "text-white" : "text-zinc-500 hover:text-zinc-300"}
              `}
            >
              {isActive && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 bg-brand/10 border border-brand/30 rounded-xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon className={`w-3.5 h-3.5 relative z-10 ${isActive ? "text-brand" : ""}`} />
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] relative z-10 truncate">
                {option.label}
              </span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {activeTimeline === "custom" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6 overflow-hidden"
          >
            <div className="flex flex-col gap-2 flex-1">
              <label
                htmlFor="temporal-start"
                className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.3em] ml-1"
              >
                Temporal Start
              </label>
              <input
                id="temporal-start"
                type="datetime-local"
                className="brutal-input text-[10px] py-2.5 px-3 scheme-dark w-full"
                value={getLocalDatetimeLocal(customRange.start)}
                onChange={(e) =>
                  onCustomRangeChange({
                    ...customRange,
                    start: new Date(e.target.value).getTime(),
                  })
                }
              />
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <label
                htmlFor="temporal-end"
                className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.3em] ml-1"
              >
                Temporal End
              </label>
              <input
                id="temporal-end"
                type="datetime-local"
                className="brutal-input text-[10px] py-2.5 px-3 scheme-dark w-full"
                value={getLocalDatetimeLocal(customRange.end)}
                onChange={(e) =>
                  onCustomRangeChange({
                    ...customRange,
                    end: new Date(e.target.value).getTime(),
                  })
                }
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
