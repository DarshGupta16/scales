import { db } from "../../lib/dexieDb";
import { pb } from "../../lib/pocketbase";
import { useDatasetStore } from "../../store";
import type { MeasurementRecord } from "../../types/dataset";

export const subscribeMeasurements = () => {
  return pb.collection("measurements").subscribe("*", async (e) => {
    const { action, record } = e;
    const updated = new Date(record.updated).getTime();
    const created = new Date(record.created).getTime();

    if (action === "create" || action === "update") {
      const measurementRecord: MeasurementRecord = {
        id: record.id,
        datasetId: record.dataset_id,
        timestamp: record.timestamp,
        value: record.value,
        created,
        updated,
      };

      useDatasetStore.setState((state) => {
        let changed = false;
        const newDatasets = state.datasets.map((dataset) => {
          if (dataset.id === measurementRecord.datasetId) {
            const existing = dataset.measurements.find((m) => m.id === record.id);

            if (existing) {
              const localUpdated = existing.updated || 0;
              if (updated <= localUpdated) {
                const isDifferent =
                  existing.value !== measurementRecord.value ||
                  existing.timestamp !== measurementRecord.timestamp;
                if (!isDifferent) return dataset;
              }

              changed = true;
              return {
                ...dataset,
                measurements: dataset.measurements.map((m) =>
                  m.id === record.id ? { ...m, ...measurementRecord } : m,
                ),
              };
            } else {
              changed = true;
              const newMeasurements = [...dataset.measurements, measurementRecord].sort(
                (a, b) => a.timestamp - b.timestamp,
              );
              return { ...dataset, measurements: newMeasurements };
            }
          }
          return dataset;
        });

        return changed ? { datasets: newDatasets } : state;
      });

      await db.measurements.put(measurementRecord);
    } else if (action === "delete") {
      useDatasetStore.setState((state) => {
        let changed = false;
        const newDatasets = state.datasets.map((dataset) => {
          if (dataset.measurements.some((m) => m.id === record.id)) {
            changed = true;
            return {
              ...dataset,
              measurements: dataset.measurements.filter((m) => m.id !== record.id),
            };
          }
          return dataset;
        });
        return changed ? { datasets: newDatasets } : state;
      });
      await db.measurements.delete(record.id);
    }
  });
};
