import readXlsx from './readXlsx.js'

import mapToObjects from './schema/mapToObjects.js'

export default function readXlsxFileContents(entries, xml, { schema, ...options}) {
	if (options.map) {
		throw new Error('`map` option was removed. Pass a `schema` option instead.')
	}
	// `readXlsx()` function creates `options.rowIndexSourceMap` property.
	// It maps parsed data row indexes to spreadsheet row indexes.
	// That's because empty rows are ignored (discarded) when parsing using `schema`.
	const result = readXlsx(entries, xml, { ...options, properties: schema || options.properties })
	if (schema) {
		return mapToObjects(result.data, schema, {
			...options,
			properties: result.properties
		})
	}
	return result
}