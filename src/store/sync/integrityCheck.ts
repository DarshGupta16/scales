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

      await db.transaction(
        "rw",
        [db.metrics, db.measurements, db.measurement_values],
        async () => {
          if (danglingMetricIds.length > 0) {
            await db.metrics.bulkDelete(danglingMetricIds);
          }
          if (danglingMeasurementIds.length > 0) {
            await db.measurements.bulkDelete(danglingMeasurementIds);
          }
          if (danglingValueIds.length > 0) {
            await db.measurement_values.bulkDelete(danglingValueIds);
          }
        },
      );
      console.log("Integrity Check: Cleanup complete.");
    }
  } catch (err) {
    console.error("Integrity Check failed:", err);
  }
}
