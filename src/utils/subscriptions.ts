import { db } from "../lib/dexieDb";
import { pb } from "../lib/pocketbase";
import { useDatasetStore } from "../store";
import type { DatasetRecord, MeasurementRecord, UnitRecord } from "../types/dataset";

export const setupSubscriptions = () => {
  // 1. DATASETS SUBSCRIPTION
  pb.collection("datasets").subscribe("*", async (e) => {
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

      // Refresh Store FIRST
      useDatasetStore.setState((state) => {
        const existing = state.datasets.find((d) => d.id === record.id);

        if (existing) {
          // CHECK: Is this update actually new?
          const localUpdated = (existing as any).updated || 0;
          if (updated <= localUpdated) {
            // Even if timestamps match, double check if data is actually different
            const isDifferent =
              existing.title !== datasetRecord.title ||
              existing.description !== datasetRecord.description ||
              existing.unit.id !== datasetRecord.unitId ||
              JSON.stringify(existing.views) !== JSON.stringify(datasetRecord.views);

            if (!isDifferent) return state; // SKIP
          }

          // Apply update
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
          // Add new
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

      // Update Dexie NEXT
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

  // 2. MEASUREMENTS SUBSCRIPTION
  pb.collection("measurements").subscribe("*", async (e) => {
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
              const localUpdated = (existing as any).updated || 0;
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

  // 3. UNITS SUBSCRIPTION
  pb.collection("units").subscribe("*", async (e) => {
    const { action, record } = e;
    const updated = new Date(record.updated).getTime();
    const created = new Date(record.created).getTime();

    const unitRecord: UnitRecord = {
      id: record.id,
      name: record.name,
      symbol: record.symbol,
      created,
      updated,
    };

    if (action === "create" || action === "update") {
      useDatasetStore.setState((state) => {
        const existing = state.units.find((u) => u.id === record.id);
        if (existing) {
          const localUpdated = (existing as any).updated || 0;
          if (updated <= localUpdated) {
            if (existing.name === unitRecord.name && existing.symbol === unitRecord.symbol)
              return state;
          }
        }

        const newUnits = existing
          ? state.units.map((u) => (u.id === record.id ? unitRecord : u))
          : [...state.units, unitRecord];

        const newDatasets = state.datasets.map((d) =>
          d.unit.id === unitRecord.id ? { ...d, unit: unitRecord } : d,
        );

        return { units: newUnits, datasets: newDatasets };
      });
      await db.units.put(unitRecord);
    } else if (action === "delete") {
      useDatasetStore.setState((state) => {
        if (!state.units.some((u) => u.id === record.id)) return state;
        return { units: state.units.filter((u) => u.id !== record.id) };
      });
      await db.units.delete(record.id);
    }
  });

  // 4. PREFERENCES SUBSCRIPTION
  pb.collection("preferences").subscribe("*", async (e) => {
    const { action, record } = e;
    const updated = new Date(record.updated).getTime();
    const created = new Date(record.created).getTime();

    const preferenceRecord = {
      id: record.id,
      preference: record.preference,
      value: record.value,
      created,
      updated,
    };

    if (action === "create" || action === "update") {
      useDatasetStore.setState((state) => {
        const existing = state.preferences.find((p) => p.id === record.id);
        if (existing) {
          const localUpdated = existing.updated || 0;
          if (updated <= localUpdated) {
            if (
              existing.preference === preferenceRecord.preference &&
              JSON.stringify(existing.value) === JSON.stringify(preferenceRecord.value)
            )
              return state;
          }
        }

        const newPreferences = existing
          ? state.preferences.map((p) => (p.id === record.id ? preferenceRecord : p))
          : [...state.preferences, preferenceRecord];

        return { preferences: newPreferences };
      });
      await db.preferences.put(preferenceRecord);
    } else if (action === "delete") {
      useDatasetStore.setState((state) => {
        if (!state.preferences.some((p) => p.id === record.id)) return state;
        return { preferences: state.preferences.filter((p) => p.id !== record.id) };
      });
      await db.preferences.delete(record.id);
    }
  });
};
