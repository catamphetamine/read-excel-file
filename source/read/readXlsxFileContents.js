import readXlsx from './readXlsx.js'

import mapToObjectsLegacyBehavior from './schema/mapToObjects.legacy.js'
import mapToObjectsSpreadsheetBehavior from './schema/mapToObjects.spreadsheet.js'

import convertMapToSchema from './schema/convertMapToSchema.js'

export default function readXlsxFileContents(entries, xml, { schema, map, ...options}) {
	if (!schema && map) {
		schema = convertMapToSchema(map)
	}
	// `readXlsx()` adds `options.rowMap`, if not passed.
	const result = readXlsx(entries, xml, { ...options, properties: schema || options.properties })
	if (schema) {
		return mapToObjectsSpreadsheetBehavior(mapToObjectsLegacyBehavior, result.data, schema, {
			...options,
			properties: result.properties
		})
	}
	return result
}