import parseSpreadsheetContents from '../xlsx/parseSpreadsheetContents.js'
import parseSheetData from '../parseSheetData/parseSheetData.js'

/**
 * Reads data from a single sheet of an `.xlsx` file as an array of rows (which are arrays of cells) or as an array of objects (if `options.schema` was passed).
 * @param  {Record<string,string>} contents - A map of `.xml` files inside the `.xlsx` file (which itself is just a zipped directory).
 * @param  {object} xml — An object having a single property — `createDocument(string)` function.
 * @param  {string|number} [sheet] — Sheet name or number.
 * @param  {object} [options]
 * @return {Sheet[]}
 */
export default function parseSheet(contents, xml, sheet, options) {
	const { data } = parseSpreadsheetContents(contents, xml, {
		...options,
		sheets: [sheet === undefined ? 1 : sheet]
	})[0]

	if (options && options.schema) {
		return parseSheetData(data, options.schema)
	}

	return data
}