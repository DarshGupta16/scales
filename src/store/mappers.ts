import type {
  DatasetRecord,
  MeasurementRecord,
  MeasurementValueRecord,
  MetricRecord,
  PreferenceRecord,
  UnitRecord,
} from "../types/dataset";

/**
 * Mappers for converting PocketBase records to local Dexie record formats.
 * Single source of truth — used by pbToLocalSync, pbDeltaSync, and subscriptions.
 */

// Tested in tests/store/mappers.test.ts
// biome-ignore lint/suspicious/noExplicitAny: PocketBase payloads are dynamic
export const mapPbDataset = (d: Record<string, any>): DatasetRecord => ({
  id: d.id,
  title: d.title,
  description: d.description,
  type: (d.type as "single" | "composite") || "single",
  views: d.views?.length ? d.views : ["line"],
  created: new Date(d.created).getTime(),
  updated: new Date(d.updated).getTime(),
  // Preserve unitId for legacy backward compatibility fallback in buildDatasets.
  // This field is optional on DatasetRecord and only present on pre-migration records.
  ...(d.unit_id ? { unitId: d.unit_id } : {}),
});

// Tested in tests/store/mappers.test.ts
// biome-ignore lint/suspicious/noExplicitAny: PocketBase payloads are dynamic
export const mapPbMetric = (m: Record<string, any>): MetricRecord => ({
  id: m.id,
  datasetId: m.dataset_id,
  name: m.name,
  unitId: m.unit_id,
  created: new Date(m.created).getTime(),
  updated: new Date(m.updated).getTime(),
});

// Tested in tests/store/mappers.test.ts
// biome-ignore lint/suspicious/noExplicitAny: PocketBase payloads are dynamic
export const mapPbMeasurement = (m: Record<string, any>): MeasurementRecord => ({
  id: m.id,
  datasetId: m.dataset_id,
  timestamp: m.timestamp,
  created: new Date(m.created).getTime(),
  updated: new Date(m.updated).getTime(),
});

// Tested in tests/store/mappers.test.ts
// biome-ignore lint/suspicious/noExplicitAny: PocketBase payloads are dynamic
export const mapPbMeasurementValue = (v: Record<string, any>): MeasurementValueRecord => ({
  id: v.id,
  measurementId: v.measurement_id,
  metricId: v.metric_id,
  value: v.value,
  created: new Date(v.created).getTime(),
  updated: new Date(v.updated).getTime(),
});

// Tested in tests/store/mappers.test.ts
// biome-ignore lint/suspicious/noExplicitAny: PocketBase payloads are dynamic
export const mapPbUnit = (u: Record<string, any>): UnitRecord => ({
  id: u.id,
  name: u.name,
  symbol: u.symbol,
  created: new Date(u.created).getTime(),
  updated: new Date(u.updated).getTime(),
});

// Tested in tests/store/mappers.test.ts
// biome-ignore lint/suspicious/noExplicitAny: PocketBase payloads are dynamic
export const mapPbPreference = (p: Record<string, any>): PreferenceRecord => ({
  id: p.id,
  preference: p.preference,
  value: p.value,
  created: new Date(p.created).getTime(),
  updated: new Date(p.updated).getTime(),
});
