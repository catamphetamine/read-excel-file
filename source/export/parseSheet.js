import parseSpreadsheetContents from '../xlsx/parseSpreadsheetContents.js'
import parseSheetData from '../parseSheetData/parseSheetData.js'

/**
 * Reads data from a single sheet of an `.xlsx` file as an array of rows (which are arrays of cells) or as an array of objects (if `options.schema` was passed).
 * @param  {function} [createWorkerFunction] — Creates a worker function.
 * @param  {function} parseXmlStream — SAX XML parser.
 * @param  {Record<string,string>} contents - A map of `.xml` files inside the `.xlsx` file (which itself is just a zipped directory).
 * @param  {string|number} [sheet] — Sheet name or number.
 * @param  {object} [options]
 * @return {Promise<SheetData>}
 */
export default function parseSheet(createWorkerFunction, parseXmlStream, contents, sheet, options) {
	return parseSpreadsheetContents(createWorkerFunction, parseXmlStream, contents, {
		...options,
		sheets: [sheet === undefined ? 1 : sheet],
	}).then((sheets) => {
		const sheetData = sheets[0].data
		if (options && options.schema) {
			return parseSheetData(sheetData, options.schema)
		}
		return sheetData
	})
}