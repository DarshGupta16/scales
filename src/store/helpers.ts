import { 
  type Dataset, 
  type DatasetRecord,
  type UnitRecord,
  type MeasurementRecord
} from "../types/dataset";

export const buildDatasets = (
  datasetRecords: DatasetRecord[],
  unitRecords: UnitRecord[],
  measurementRecords: MeasurementRecord[]
): Dataset[] => {
  return datasetRecords.map((d) => {
    const unit = unitRecords.find((u) => u.id === d.unitId) || {
      id: "unknown",
      name: "Unknown",
      symbol: "?",
    };
    const measurements = measurementRecords
      .filter((m) => m.datasetId === d.id)
      .map(({ id, timestamp, value }) => ({ id, timestamp, value }));
      
    return {
      id: d.id,
      title: d.title,
      description: d.description,
      views: d.views,
      createdAt: d.createdAt,
      unit,
      measurements,
    };
  });
};
