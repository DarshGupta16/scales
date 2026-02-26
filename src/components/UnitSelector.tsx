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
        className="w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-left"
      >
        <span className="text-slate-700 capitalize">{value}</span>
        <ChevronsUpDown className="w-4 h-4 text-slate-400" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-[60]" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[70] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                autoFocus
                type="text"
                placeholder="Search units..."
                className="w-full bg-transparent border-none focus:ring-0 text-sm py-1 placeholder-slate-400"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="max-h-60 overflow-y-auto p-2">
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
                    w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all
                    ${value === unit 
                      ? "bg-indigo-50 text-indigo-700 font-bold" 
                      : "text-slate-600 hover:bg-slate-50"
                    }
                  `}
                >
                  <span className="capitalize">{unit}</span>
                  {value === unit && <Check className="w-4 h-4" />}
                </button>
              ))}
              {filteredUnits.length === 0 && (
                <div className="p-4 text-center text-xs text-slate-400 italic">
                  No units found.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
