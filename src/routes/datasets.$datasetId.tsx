import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useDatasetStore } from "@/store";
import type { Measurement, MeasurementValueRecord } from "@/types/dataset";
import { DatasetDetailNotFound } from "../components/datasets/DatasetDetailNotFound";
import { DatasetDetailView } from "../components/datasets/DatasetDetailView";

export const Route = createFileRoute("/datasets/$datasetId")({
  component: DatasetDetail,
});

function DatasetDetail() {
  const { datasetId } = Route.useParams();
  const dataset = useDatasetStore((state) => state.datasetsById[datasetId]);
  const updateDataset = useDatasetStore((state) => state.updateDataset);
  const removeDataset = useDatasetStore((state) => state.removeDataset);
  const addMeasurement = useDatasetStore((state) => state.addMeasurement);

  const navigate = useNavigate();

  if (!dataset) {
    return <DatasetDetailNotFound />;
  }

  const handleDeleteDataset = (id: string) => {
    removeDataset(id);
    navigate({ to: "/" });
  };

  const handleAddMeasurement = (newMeasurement: Measurement, values: MeasurementValueRecord[]) => {
    addMeasurement(datasetId, newMeasurement, values);
  };

  return (
    <DatasetDetailView
      dataset={dataset}
      onUpdateDataset={updateDataset}
      onDeleteDataset={handleDeleteDataset}
      onAddMeasurement={handleAddMeasurement}
    />
  );
}
