import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import type { Measurement, ViewType } from "../../types/dataset";
import { formatDate } from "../../utils/format";

const DatasetGraphContent = lazy(() => import("./DatasetGraphContent"));

interface DatasetGraphProps {
  data: Measurement[];
  viewType: ViewType;
  unit: string;
}

interface ChartData extends Measurement {
  tooltipId: string;
  displayDate: string;
}

export function DatasetGraph({ data, viewType, unit }: DatasetGraphProps) {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const chartData = useMemo<ChartData[]>(() => {
    const sortedData = [...data].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
    return sortedData.map((m, index) => ({
      ...m,
      tooltipId: `${m.id || index.toString()}-${m.timestamp}`,
      displayDate: isClient ? formatDate(m.timestamp, "full") : "",
    }));
  }, [data, isClient]);

  return (
    <div className="w-full h-75 sm:h-100 min-w-0 bg-[#070707] rounded-3xl p-2 sm:p-6 relative">
      {isClient && (
        <Suspense fallback={<div className="w-full h-full animate-pulse bg-white/5 rounded-2xl" />}>
          <DatasetGraphContent chartData={chartData} viewType={viewType} unit={unit} />
        </Suspense>
      )}
    </div>
  );
}
