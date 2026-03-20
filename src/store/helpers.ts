import { 
  type Dataset, 
  type DatasetRecord,
  type UnitRecord,
  type MeasurementRecord,
  type Measurement
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
      created: Date.now(),
      updated: Date.now()
    };
    
    const measurements: Measurement[] = measurementRecords
      .filter((m) => m.datasetId === d.id)
      .map((m) => ({ 
        id: m.id, 
        timestamp: m.timestamp, 
        value: m.value,
        created: m.created,
        updated: m.updated
      }));
      
    return {
      id: d.id,
      title: d.title,
      description: d.description,
      views: d.views,
      created: d.created,
      updated: d.updated,
      unit,
      measurements,
    };
  });
};
