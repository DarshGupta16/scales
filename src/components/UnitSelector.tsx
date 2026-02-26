import type { Unit } from "../types/dataset";
import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";

interface UnitSelectorProps {
  value: Unit;
  onChange: (value: Unit) => void;
}

const ALL_UNITS: Unit[] = [
  "seconds", "minutes", "hours", "days", "weeks", "months", "years",
  "meters", "kilometers", "miles",
  "grams", "kilograms", "pounds",
  "celsius", "fahrenheit",
  "percentage",
  "bytes", "kilobytes", "megabytes", "gigabytes", "terabytes",
  "dollars", "euros", "rupees",
  "count"
];

export function UnitSelector({ value, onChange }: UnitSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredUnits = useMemo(() => {
    return ALL_UNITS.filter(u => u.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-black border-2 border-white focus:outline-none focus:border-brand focus:shadow-[4px_4px_0_0_var(--color-brand)] transition-all text-left rounded-none"
      >
        <span className="text-white uppercase tracking-widest font-bold text-sm">{value}</span>
        <ChevronsUpDown className="w-5 h-5 text-brand" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-[60]" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute top-full left-0 right-0 mt-2 bg-black border-2 border-white brutal-shadow z-[70] overflow-hidden rounded-none">
            <div className="p-3 border-b-2 border-white bg-[#111] flex items-center gap-2">
              <Search className="w-5 h-5 text-brand" />
              <input
                autoFocus
                type="text"
                placeholder="FILTER..."
                className="w-full bg-transparent border-none focus:ring-0 text-sm py-1 placeholder-zinc-600 text-white uppercase tracking-widest font-bold"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="max-h-60 overflow-y-auto p-2 bg-black">
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
                    w-full flex items-center justify-between px-3 py-3 text-sm transition-all uppercase tracking-widest font-bold rounded-none
                    ${value === unit 
                      ? "bg-brand text-black border-2 border-brand" 
                      : "text-zinc-400 hover:bg-[#111] hover:text-white border-2 border-transparent"
                    }
                  `}
                >
                  <span>{unit}</span>
                  {value === unit && <Check className="w-5 h-5" />}
                </button>
              ))}
              {filteredUnits.length === 0 && (
                <div className="p-4 text-center text-xs text-zinc-600 uppercase tracking-widest font-bold">
                  NULL RESULT.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
