/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // Find all datasets that haven't been migrated yet (they still have a unit_id)
  const datasets = app.findRecordsByFilter("datasets", "unit_id != ''");
  
  const metricsCollection = app.findCollectionByNameOrId("metrics");
  const valuesCollection = app.findCollectionByNameOrId("measurement_values");

  for (let i = 0; i < datasets.length; i++) {
    const ds = datasets[i];
    
    // 1. Update dataset type to "single"
    ds.set("type", "single");
    app.save(ds);

    // 2. Create the default metric for this dataset
    const metric = new Record(metricsCollection);
    metric.set("dataset_id", ds.id);
    metric.set("name", "Value");
    metric.set("unit_id", ds.get("unit_id"));
    app.save(metric);

    // 3. Move all measurement values
    const measurements = app.findRecordsByFilter("measurements", `dataset_id = '${ds.id}'`);
    for (let j = 0; j < measurements.length; j++) {
      const m = measurements[j];
      
      // Ensure there is actually a value to migrate
      if (m.get("value") !== null && m.get("value") !== undefined) {
        const mv = new Record(valuesCollection);
        mv.set("measurement_id", m.id);
        mv.set("metric_id", metric.id);
        mv.set("value", m.get("value"));
        app.save(mv);
      }
    }
  }
}, (app) => {
  // Rollback: We don't strictly need to revert the data migration since dropping the tables 
  // in a previous rollback would destroy the data anyway, but we can clear the metrics 
  // as a safety measure. (Cascade delete will remove measurement_values automatically).
  const metrics = app.findRecordsByFilter("metrics", "name = 'Value'");
  for (let i = 0; i < metrics.length; i++) {
    app.delete(metrics[i]);
  }
});
