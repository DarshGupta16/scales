import { Check, ChevronsUpDown, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useDatasetStore } from "@/store";
import type { Unit } from "../../types/dataset";

interface UnitSelectorProps {
  value: Unit | null;
  onChange: (unit: Unit) => void;
}

export function UnitSelector({ value, onChange }: UnitSelectorProps) {
  const { units } = useDatasetStore();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredUnits = useMemo(() => {
    return units.filter(
      (u) =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.symbol.toLowerCase().includes(search.toLowerCase()),
    );
  }, [units, search]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-zinc-900/50 border border-white/10 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all text-left rounded-xl"
      >
        <span className="text-white uppercase tracking-widest font-bold text-[10px]">
          {value ? `${value.name} (${value.symbol})` : "Select Unit..."}
        </span>
        <ChevronsUpDown className="w-4 h-4 text-brand" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-white/10 shadow-2xl z-50 overflow-hidden rounded-2xl animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-3 border-b border-white/5 bg-white/[0.02] flex items-center gap-2">
              <Search className="w-4 h-4 text-zinc-500" />
              <input
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
                  key={unit.id}
                  type="button"
                  onClick={() => {
                    onChange(unit);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`
                    w-full flex items-center justify-between px-4 py-3 text-[10px] transition-all uppercase tracking-widest font-bold rounded-xl
                    ${
                      value?.id === unit.id
                        ? "bg-brand text-white shadow-lg shadow-brand/20"
                        : "text-zinc-500 hover:bg-white/5 hover:text-white"
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-brand opacity-50">{unit.symbol}</span>
                    <span>{unit.name}</span>
                  </div>
                  {value?.id === unit.id && <Check className="w-4 h-4" />}
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
