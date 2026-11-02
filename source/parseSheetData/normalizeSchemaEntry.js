import isObject from '../utility/isObject.js'

/**
 * Normalizes a schema entry: determines if it's a schema of a property or a schema of a nested object.
 * @param {object} schemaEntry — Non-normalized schema entry
 * @returns {object} Normalized schema entry
 */
export default function normalizeSchemaEntry(schemaEntry) {
  return schemaEntry
  // if (typeof schemaEntry === 'string') {
  //   return { column: schemaEntry }
  // }
  // if (typeof schemaEntry.column === 'string') {
  //   return schemaEntry
  // }
  // if (isObject(schemaEntry.schema)) {
  //   return schemaEntry
  // }
  // return { schema: schemaEntry }
}
