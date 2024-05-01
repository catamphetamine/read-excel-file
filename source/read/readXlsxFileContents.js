import readXlsx from './readXlsx.js'

import convertToJsonLegacyBehavior from './schema/convertToJson.legacy.js'
import convertToJsonSpreadsheetBehavior from './schema/convertToJson.spreadsheet.js'

import convertMapToSchema from './schema/convertMapToSchema.js'

export default function readXlsxFileContents(entries, xml, { schema, map, ...options}) {
	if (!schema && map) {
		schema = convertMapToSchema(map)
	}
	// `readXlsx()` adds `options.rowMap`, if not passed.
	const result = readXlsx(entries, xml, { ...options, properties: schema || options.properties })
	if (schema) {
		return convertToJsonSpreadsheetBehavior(convertToJsonLegacyBehavior, result.data, schema, {
			...options,
			properties: result.properties
		})
	}
	return result
}