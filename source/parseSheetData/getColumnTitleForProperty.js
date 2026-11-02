import normalizeSchemaEntry from './normalizeSchemaEntry.js'

/**
 * Returns a column title for a given property path.
 * It could be used to present more human-readable errors
 * when post-validating the `objects` with something like `zod`.
 * @param {string[]} path
 * @param {object} schema
 * @returns {string} [columnTitle]
 */
export default function getColumnTitleForProperty(path, schema) {
  // Start with a top-level "property".
  let isObject = true
  let schemaEntry = { schema }
  // For each segment of the `path`, go deeper into the schema.
  let i = 0
  while (i < path.length) {
    if (isObject) {
      const schemaEntryOfChildProperty = schemaEntry.schema[path[i]]
      if (schemaEntryOfChildProperty) {
        // Continue on the next iteration with this child property.
        schemaEntry = normalizeSchemaEntry(schemaEntryOfChildProperty)
        isObject = 'schema' in schemaEntry
      } else {
        // Property not found in the schema.
        // No column title could be determined.
        return
      }
    } else {
      // The `path` is not valid because it expects the previous path segment
			// to point to a nested object while in reality it's not a nested object
			// and is just a simple property.
      return
    }
    i++
  }
	// The entire `path` has been traversed.
	// If it stopped at a "leaf" property then return that property's column title.
	// Otherwise, it stopped at at some nested object. In that case, no column title could be determined.
	if (!isObject) {
		return schemaEntry.column
	}
}
