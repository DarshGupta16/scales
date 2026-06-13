import { db } from "../../lib/dexieDb";
import { pb } from "../../lib/pocketbase";
import type { DatasetRecord, MeasurementValueRecord, MetricRecord } from "../../types/dataset";

export const localToPbSyncStrategy = async (): Promise<void> => {
  const ops = await db.offline_ops.orderBy("timestamp").toArray();
  if (ops.length === 0) return;

  console.log(`Syncing ${ops.length} offline operations to PocketBase...`);

  for (const op of ops) {
    try {
      const collection = pb.collection(op.collection);

      if (op.action === "create") {
        if (op.collection === "datasets") {
          const data = op.data as {
            datasetRecord: DatasetRecord;
            metricRecords: MetricRecord[];
          };
          const { datasetRecord, metricRecords } = data;

          await pb.collection("datasets").create({
            id: datasetRecord.id,
            title: datasetRecord.title,
            description: datasetRecord.description,
            type: datasetRecord.type,
            views: datasetRecord.views,
            created: new Date(datasetRecord.created).toISOString(),
          });

          for (const metric of metricRecords) {
            await pb.collection("metrics").create({
              id: metric.id,
              dataset_id: metric.datasetId,
              name: metric.name,
              unit_id: metric.unitId,
              created: new Date(metric.created).toISOString(),
            });
          }
        } else if (op.collection === "measurements") {
          // biome-ignore lint/suspicious/noExplicitAny: Sync payload
          const data = op.data as any;

          const measurementRecord = data.measurementRecord || data;
          const valueRecords = data.valueRecords || [];

          await pb.collection("measurements").create({
            id: measurementRecord.id,
            dataset_id: measurementRecord.datasetId,
            timestamp: measurementRecord.timestamp,
            created: new Date(measurementRecord.created).toISOString(),
          });

          for (const v of valueRecords) {
            await pb.collection("measurement_values").create({
              id: v.id,
              measurement_id: v.measurementId,
              metric_id: v.metricId,
              value: v.value,
              created: new Date(v.created).toISOString(),
            });
          }
        } else if (op.collection === "measurement_values") {
          const data = op.data as MeasurementValueRecord;
          await pb.collection("measurement_values").create({
            id: data.id,
            measurement_id: data.measurementId,
            metric_id: data.metricId,
            value: data.value,
            created: new Date(data.created).toISOString(),
          });
        } else {
          if (op.data) await collection.create(op.data);
        }
      } else if (op.action === "update") {
        if (op.collection === "datasets") {
          const data = op.data as { datasetRecord: DatasetRecord };
          const { datasetRecord } = data;
          await collection.update(op.recordId, {
            title: datasetRecord.title,
            description: datasetRecord.description,
            views: datasetRecord.views,
          });
        } else {
          if (op.data) await collection.update(op.recordId, op.data);
        }
      } else if (op.action === "delete") {
        try {
          await collection.delete(op.recordId);
        } catch (err: unknown) {
          if (err && typeof err === "object" && "status" in err && err.status !== 404) throw err;
        }
      }

      if (op.id !== undefined) {
        await db.offline_ops.delete(op.id);
      }
    } catch (err) {
      console.error(`Failed to sync op ${op.id}:`, err);
      if (!navigator.onLine) break;
    }
  }
};
