import { db } from "../../lib/dexieDb";

/**
 * Validates database integrity and cleans up orphaned/dangling records.
 * Runs efficiently by loading IDs only.
 */
export async function runIntegrityCheck(): Promise<void> {
  try {
    const datasetRecords = await db.datasets.toArray();
    const datasetIds = datasetRecords.map((d) => d.id);
    const [metricRecords, measurementRecords, valueRecords] = await Promise.all([
      db.metrics.toArray(),
      db.measurements.toArray(),
      db.measurement_values.toArray(),
    ]);

    const validDatasetIds = new Set(datasetIds as string[]);

    // 1. Find dangling metrics (dataset missing)
    const danglingMetricIds = metricRecords
      .filter((m) => !validDatasetIds.has(m.datasetId))
      .map((m) => m.id);

    // 2. Find dangling measurements (dataset missing)
    const danglingMeasurementIds = measurementRecords
      .filter((m) => !validDatasetIds.has(m.datasetId))
      .map((m) => m.id);

    const validMeasurementIds = new Set(
      measurementRecords.filter((m) => validDatasetIds.has(m.datasetId)).map((m) => m.id),
    );

    // 3. Find dangling values (measurement missing)
    const danglingValueIds = valueRecords
      .filter((v) => !validMeasurementIds.has(v.measurementId))
      .map((v) => v.id);

    const hasAnomalies =
      danglingMetricIds.length > 0 ||
      danglingMeasurementIds.length > 0 ||
      danglingValueIds.length > 0;

    if (hasAnomalies) {
      console.warn("Integrity Check: Anomalies found. Cleaning up...", {
        danglingMetricIds,
        danglingMeasurementIds,
        danglingValueIds,
      });

      await db.transaction("rw", [db.metrics, db.measurements, db.measurement_values], async () => {
        if (danglingMetricIds.length > 0) {
          await db.metrics.bulkDelete(danglingMetricIds);
        }
        if (danglingMeasurementIds.length > 0) {
          await db.measurements.bulkDelete(danglingMeasurementIds);
        }
        if (danglingValueIds.length > 0) {
          await db.measurement_values.bulkDelete(danglingValueIds);
        }
      });
      console.log("Integrity Check: Cleanup complete.");
    }

    // 4. Validate Store state (flat maps referential integrity)
    const { useDatasetStore } = await import("../../store");
    const store = useDatasetStore.getState();
    const {
      datasetsById,
      datasetIds: storeDatasetIds,
      metricsById,
      measurementsById,
      valuesById,
    } = store;

    let storeChanged = false;
    const newDatasetsById = { ...(datasetsById || {}) };
    const safeMetricsById = metricsById || {};
    const safeMeasurementsById = measurementsById || {};
    const safeValuesById = valuesById || {};

    for (const dId of storeDatasetIds || []) {
      const dataset = newDatasetsById[dId];
      if (!dataset) continue;

      const validMeasurementIds = (dataset.measurementIds || []).filter(
        (id) => !!safeMeasurementsById[id],
      );
      const validMetricIds = (dataset.metricIds || []).filter((id) => !!safeMetricsById[id]);

      if (
        validMeasurementIds.length !== (dataset.measurementIds || []).length ||
        validMetricIds.length !== (dataset.metricIds || []).length
      ) {
        newDatasetsById[dId] = {
          ...dataset,
          measurementIds: validMeasurementIds,
          metricIds: validMetricIds,
        };
        storeChanged = true;
      }
    }

    const newMeasurementsById = { ...safeMeasurementsById };
    for (const mId of Object.keys(newMeasurementsById)) {
      const meas = newMeasurementsById[mId];
      if (!meas) continue;

      const validValueIds = (meas.valueIds || []).filter((id) => !!safeValuesById[id]);
      if (validValueIds.length !== (meas.valueIds || []).length) {
        newMeasurementsById[mId] = { ...meas, valueIds: validValueIds };
        storeChanged = true;
      }
    }

    if (storeChanged) {
      console.warn("Integrity Check: Store anomalies found. Cleaning up arrays...");
      useDatasetStore.setState({
        datasetsById: newDatasetsById,
        measurementsById: newMeasurementsById,
      });
    }
  } catch (err) {
    console.error("Integrity Check failed:", err);
  }
}
