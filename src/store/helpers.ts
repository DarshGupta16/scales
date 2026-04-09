import type {
	Dataset,
	DatasetRecord,
	MetricRecord,
	MeasurementRecord,
	MeasurementValueRecord,
	UnitRecord,
	Metric,
	Measurement,
	MeasurementValue,
} from "../types/dataset";

const UNKNOWN_UNIT: UnitRecord = {
	id: "unknown",
	name: "Unknown",
	symbol: "?",
	created: 0,
	updated: 0,
};

/**
 * Assembles denormalized Dataset objects from normalized records.
 * Uses Map-based lookups for O(n) performance instead of nested .filter()/.find().
 */
// Tested in tests/store/helpers.test.ts
export const buildDatasets = (
	datasetRecords: DatasetRecord[],
	metricRecords: MetricRecord[],
	unitRecords: UnitRecord[],
	measurementRecords: MeasurementRecord[],
	valueRecords: MeasurementValueRecord[],
): Dataset[] => {
	// Pre-build lookup indices
	const unitMap = new Map(unitRecords.map((u) => [u.id, u]));

	const metricsByDataset = new Map<string, MetricRecord[]>();
	for (const m of metricRecords) {
		const list = metricsByDataset.get(m.datasetId);
		if (list) list.push(m);
		else metricsByDataset.set(m.datasetId, [m]);
	}

	const measurementsByDataset = new Map<string, MeasurementRecord[]>();
	for (const m of measurementRecords) {
		const list = measurementsByDataset.get(m.datasetId);
		if (list) list.push(m);
		else measurementsByDataset.set(m.datasetId, [m]);
	}

	const valuesByMeasurement = new Map<string, MeasurementValueRecord[]>();
	for (const v of valueRecords) {
		const list = valuesByMeasurement.get(v.measurementId);
		if (list) list.push(v);
		else valuesByMeasurement.set(v.measurementId, [v]);
	}

	return datasetRecords.map((d) => {
		// 1. Resolve metrics for this dataset
		const rawMetrics = metricsByDataset.get(d.id) || [];
		const metrics: Metric[] = rawMetrics.map((m) => ({
			id: m.id,
			name: m.name,
			unit: unitMap.get(m.unitId) || UNKNOWN_UNIT,
		}));

		// Build a quick metric lookup for value resolution
		const metricMap = new Map(metrics.map((m) => [m.id, m]));

		// 2. Resolve measurements for this dataset
		const rawMeasurements = measurementsByDataset.get(d.id) || [];
		const measurements: Measurement[] = rawMeasurements.map((m) => {
			const rawValues = valuesByMeasurement.get(m.id) || [];
			const values: MeasurementValue[] = rawValues.map((v) => {
				const metric = metricMap.get(v.metricId);
				return {
					metricId: v.metricId,
					name: metric?.name || "Unknown",
					value: v.value,
					unit: metric?.unit || UNKNOWN_UNIT,
				};
			});

			return {
				id: m.id,
				timestamp: m.timestamp,
				values,
				created: m.created,
				updated: m.updated,
			};
		});

		// 3. Sort measurements descending by timestamp
		const sortedMeasurements = measurements.sort(
			(a, b) => b.timestamp - a.timestamp,
		);

		// 4. Determine primary unit (first metric)
		const primaryUnit = metrics[0]?.unit || UNKNOWN_UNIT;

		return {
			id: d.id,
			title: d.title,
			description: d.description,
			type: d.type || "single",
			views: d.views,
			created: d.created,
			updated: d.updated,
			metrics,
			measurements: sortedMeasurements,
			unit: primaryUnit,
			latestMeasurement: sortedMeasurements[0],
		};
	});
};
