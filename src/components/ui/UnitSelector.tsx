import { Check, ChevronsUpDown, Search, Settings2 } from "lucide-react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDatasetStore } from "@/store";
import type { Unit } from "../../types/dataset";
import { UnitsModal } from "./UnitsModal";

interface UnitSelectorProps {
  value: Unit | null;
  onChange: (unit: Unit) => void;
}

export function UnitSelector({ value, onChange }: UnitSelectorProps) {
  const { units } = useDatasetStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isUnitsModalOpen, setIsUnitsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const filteredUnits = useMemo(() => {
    return units.filter(
      (u) =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.symbol.toLowerCase().includes(search.toLowerCase()),
    );
  }, [units, search]);

  useLayoutEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8, // 8px margin
        left: rect.left,
        width: rect.width,
      });
    } else {
      setDropdownPosition(null);
    }
  }, [isOpen]);

  const dropdown = dropdownPosition && (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[200] cursor-default bg-black/20"
        onClick={() => setIsOpen(false)}
        aria-label="Close selector"
      />
      <div
        className="fixed bg-zinc-900 border border-white/10 shadow-2xl z-[201] overflow-hidden rounded-2xl animate-in fade-in slide-in-from-top-2 duration-200"
        style={{
          top: dropdownPosition.top,
          left: dropdownPosition.left,
          width: dropdownPosition.width,
        }}
      >
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
        <div className="max-h-60 sm:max-h-48 md:max-h-40 overflow-y-auto p-2 bg-zinc-900 custom-scrollbar">
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
        <div className="p-2 border-t border-white/5 bg-white/[0.02]">
          <button
            type="button"
            onClick={() => {
              setIsUnitsModalOpen(true);
              setIsOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-[10px] text-zinc-400 hover:text-white hover:bg-white/5 transition-all uppercase tracking-widest font-bold rounded-xl"
          >
            <Settings2 className="w-4 h-4 text-brand" />
            Manage Units
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-zinc-900/50 border border-white/10 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all text-left rounded-xl"
      >
        <span className="text-white uppercase tracking-widest font-bold text-[10px]">
          {value ? `${value.name} (${value.symbol})` : "Select Unit..."}
        </span>
        <ChevronsUpDown className="w-4 h-4 text-brand" />
      </button>

      {isOpen && typeof document !== "undefined" && createPortal(dropdown, document.body)}

      <UnitsModal isOpen={isUnitsModalOpen} onClose={() => setIsUnitsModalOpen(false)} />
    </div>
  );
}
