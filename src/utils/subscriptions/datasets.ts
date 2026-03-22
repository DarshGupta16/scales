import { db } from "../../lib/dexieDb";
import { pb } from "../../lib/pocketbase";
import { useDatasetStore } from "../../store";
import type { DatasetRecord } from "../../types/dataset";

export const subscribeDatasets = () => {
  return pb.collection("datasets").subscribe("*", async (e) => {
    const { action, record } = e;
    const updated = new Date(record.updated).getTime();
    const created = new Date(record.created).getTime();

    if (action === "create" || action === "update") {
      const datasetRecord: DatasetRecord = {
        id: record.id,
        title: record.title,
        description: record.description,
        unitId: record.unit_id,
        views: record.views,
        created,
        updated,
      };

      useDatasetStore.setState((state) => {
        const existing = state.datasets.find((d) => d.id === record.id);

        if (existing) {
          const localUpdated = existing.updated || 0;
          if (updated <= localUpdated) {
            const isDifferent =
              existing.title !== datasetRecord.title ||
              existing.description !== datasetRecord.description ||
              existing.unit.id !== datasetRecord.unitId ||
              JSON.stringify(existing.views) !== JSON.stringify(datasetRecord.views);

            if (!isDifferent) return state;
          }

          return {
            datasets: state.datasets.map((d) =>
              d.id === record.id
                ? {
                    ...d,
                    title: datasetRecord.title,
                    description: datasetRecord.description,
                    views: datasetRecord.views,
                    unit: state.units.find((u) => u.id === datasetRecord.unitId) || d.unit,
                    created: datasetRecord.created,
                    updated: datasetRecord.updated,
                  }
                : d,
            ),
          };
        } else {
          return {
            datasets: [
              {
                ...datasetRecord,
                unit: state.units.find((u) => u.id === datasetRecord.unitId) || {
                  id: datasetRecord.unitId,
                  name: "Unknown",
                  symbol: "",
                  created: Date.now(),
                  updated: Date.now(),
                },
                measurements: [],
              },
              ...state.datasets,
            ],
          };
        }
      });

      await db.datasets.put(datasetRecord);
    } else if (action === "delete") {
      useDatasetStore.setState((state) => {
        if (!state.datasets.some((d) => d.id === record.id)) return state;
        return { datasets: state.datasets.filter((d) => d.id !== record.id) };
      });
      await Promise.all([
        db.datasets.delete(record.id),
        db.measurements.where("datasetId").equals(record.id).delete(),
      ]);
    }
  });
};
