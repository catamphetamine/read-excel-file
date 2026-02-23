import parseXlsxFileContents from './parseXlsxFileContents.js'

import mapToObjects from './schema/mapToObjects.js'

/**
 * Reads data from an `.xlsx` spreadsheet.
 * @param {Record<string,string>} contents — A map of XML files inside XLSX file (which is just a zipped directory).
 * @param {object} xml — An object with a function `createDocument(string)`.
 * @param {object} options
 * @returns Spreadsheet data
 */
export default function parseXlsxFileContentsWithOptionalSchema(contents, xml, { schema, ...options }) {
	if (options.map) {
		throw new Error('`map` option was removed. Pass a `schema` option instead.')
	}
	// `parseXlsxFileContents()` function creates `options.rowIndexSourceMap` property.
	// It maps parsed data row indexes to spreadsheet row indexes.
	// That's because empty rows are ignored (discarded) when parsing using `schema`.
	const result = parseXlsxFileContents(contents, xml, {
		...options,
		properties: schema || options.properties
	})
	if (schema) {
		return mapToObjects(result.data, schema, {
			...options,
			properties: result.properties
		})
	}
	return result
}