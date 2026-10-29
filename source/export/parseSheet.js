import parseSpreadsheetContents from '../xlsx/parseSpreadsheetContents.js'
import parseSheetData from '../parseSheetData/parseSheetData.js'

/**
 * Reads data from a single sheet of an `.xlsx` file as an array of rows (which are arrays of cells) or as an array of objects (if `options.schema` was passed).
 * @param  {function} [createWorkerFunction] — Creates a worker function.
 * @param  {function} parseXml — SAX XML parser.
 * @param  {Record<string,Uint8Array>} contents - A map of `.xml` files inside the `.xlsx` file (which itself is just a zipped directory).
 * @param  {string|number} [sheet] — Sheet name or number.
 * @param  {object} [options]
 * @return {Promise<SheetData>}
 */
export default function parseSheet(createWorkerFunction, parseXml, contents, sheet, optionsWithSchema) {
	// Extract `schema` property from the `options`.
	//
	// It could also extract properties like:
	// * `transformEmptyObject`
	// * `transformEmptyArray`
	// * `propertyValueWhenColumnIsMissing`
	// * `propertyValueWhenCellIsEmpty`
	//
	const { schema, ...options } = optionsWithSchema || {}
	return parseSpreadsheetContents(createWorkerFunction, parseXml, contents, {
		...options,
		sheets: [sheet === undefined ? 1 : sheet],
	}).then((sheets) => {
		const sheetData = sheets[0].data
		if (schema) {
			return parseSheetData(sheetData, schema, options)
		}
		return sheetData
	})
}