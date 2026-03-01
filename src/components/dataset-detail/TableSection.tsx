import { DatasetTable } from "../DatasetTable";
import type { Measurement } from "../../types/dataset";

interface TableSectionProps {
  measurements: Measurement[];
  unit: string;
  onDeleteMeasurement: (id: string) => void;
}

export function TableSection({
  measurements,
  unit,
  onDeleteMeasurement,
}: TableSectionProps) {
  return (
    <section className="flex flex-col gap-10">
      <div className="flex items-center justify-between border-l-2 border-brand/50 pl-6">
        <h2 className="text-xl font-display font-bold text-white uppercase tracking-tight">
          Sequence Log
        </h2>
        <span className="text-[10px] font-bold font-sans text-zinc-500 uppercase tracking-[0.3em] px-4 py-2 bg-white/5 rounded-full border border-white/5">
          Entries: {measurements.length}
        </span>
      </div>
      <DatasetTable
        measurements={measurements}
        unit={unit}
        onDelete={onDeleteMeasurement}
      />
    </section>
  );
}
