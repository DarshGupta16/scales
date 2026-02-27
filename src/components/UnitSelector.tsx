import type { Unit } from "../types/dataset";
import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";

interface UnitSelectorProps {
  value: Unit;
  onChange: (value: Unit) => void;
}

const ALL_UNITS: Unit[] = [
  "seconds",
  "minutes",
  "hours",
  "days",
  "weeks",
  "months",
  "years",
  "meters",
  "kilometers",
  "miles",
  "grams",
  "kilograms",
  "pounds",
  "celsius",
  "fahrenheit",
  "percentage",
  "bytes",
  "kilobytes",
  "megabytes",
  "gigabytes",
  "terabytes",
  "dollars",
  "euros",
  "rupees",
  "count",
];

export function UnitSelector({ value, onChange }: UnitSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredUnits = useMemo(() => {
    return ALL_UNITS.filter((u) =>
      u.toLowerCase().includes(search.toLowerCase()),
    );
  }, [search]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-zinc-900/50 border border-white/10 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all text-left rounded-xl"
      >
        <span className="text-white uppercase tracking-widest font-bold text-[10px]">
          {value}
        </span>
        <ChevronsUpDown className="w-4 h-4 text-brand" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[60]"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-white/10 shadow-2xl z-[70] overflow-hidden rounded-2xl animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-3 border-b border-white/5 bg-white/[0.02] flex items-center gap-2">
              <Search className="w-4 h-4 text-zinc-500" />
              <input
                autoFocus
                type="text"
                placeholder="Filter Units..."
                className="w-full bg-transparent border-none focus:ring-0 text-xs py-1 placeholder-zinc-600 text-white uppercase tracking-widest font-bold"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="max-h-60 overflow-y-auto p-2 bg-zinc-900">
              {filteredUnits.map((unit) => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => {
                    onChange(unit);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`
                    w-full flex items-center justify-between px-4 py-3 text-[10px] transition-all uppercase tracking-widest font-bold rounded-xl
                    ${
                      value === unit
                        ? "bg-brand text-white shadow-lg shadow-brand/20"
                        : "text-zinc-500 hover:bg-white/5 hover:text-white"
                    }
                  `}
                >
                  <span>{unit}</span>
                  {value === unit && <Check className="w-4 h-4" />}
                </button>
              ))}
              {filteredUnits.length === 0 && (
                <div className="p-4 text-center text-[10px] text-zinc-600 uppercase tracking-widest font-bold">
                  Zero results.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
