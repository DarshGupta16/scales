import { useDatasetStore } from "@/store";
import type { Dataset } from "../../types/dataset";
import { DatasetGrid } from "./DatasetGrid";
import { DatasetList } from "./DatasetList";

interface DatasetViewProps {
  datasets: Dataset[];
  onEdit?: (dataset: Dataset) => void;
  onDelete?: (dataset: Dataset) => void;
}

export function DatasetView({ datasets, onEdit, onDelete }: DatasetViewProps) {
  const { preferences } = useDatasetStore();
  const viewMode = preferences.find((p) => p.preference === "view_mode")?.value || "grid";

  if (viewMode === "list") {
    return <DatasetList datasets={datasets} onEdit={onEdit} onDelete={onDelete} />;
  }

  return <DatasetGrid datasets={datasets} onEdit={onEdit} onDelete={onDelete} />;
}
