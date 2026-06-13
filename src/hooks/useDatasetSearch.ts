import { useMemo, useState } from "react";
import type { Dataset } from "../types/dataset";

export function useDatasetSearch(datasets: Dataset[] = []) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDatasets = useMemo(() => {
    return datasets
      .filter(
        (d) =>
          d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.unit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.unit.symbol.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      .sort((a, b) => (a.created || 0) - (b.created || 0));
  }, [datasets, searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    filteredDatasets,
  };
}
