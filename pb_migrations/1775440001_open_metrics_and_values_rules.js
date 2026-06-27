/// <reference path="../pb_data/types.d.ts" />

// Fix: metrics and measurement_values collections were created with null (admin-only)
// access rules but never had a follow-up migration to open them for public access.
// This caused all unauthenticated frontend API calls to return 403 Forbidden.

migrate((app) => {
  // Open metrics collection (pbc_3017397517)
  const metrics = app.findCollectionByNameOrId("pbc_3017397517")
  unmarshal({
    "createRule": "",
    "deleteRule": "",
    "listRule": "",
    "updateRule": "",
    "viewRule": ""
  }, metrics)
  app.save(metrics)

  // Open measurement_values collection (pbc_1414371822)
  const values = app.findCollectionByNameOrId("pbc_1414371822")
  unmarshal({
    "createRule": "",
    "deleteRule": "",
    "listRule": "",
    "updateRule": "",
    "viewRule": ""
  }, values)
  app.save(values)
}, (app) => {
  // Rollback: restore admin-only rules
  const metrics = app.findCollectionByNameOrId("pbc_3017397517")
  unmarshal({
    "createRule": null,
    "deleteRule": null,
    "listRule": null,
    "updateRule": null,
    "viewRule": null
  }, metrics)
  app.save(metrics)

  const values = app.findCollectionByNameOrId("pbc_1414371822")
  unmarshal({
    "createRule": null,
    "deleteRule": null,
    "listRule": null,
    "updateRule": null,
    "viewRule": null
  }, values)
  app.save(values)
})
