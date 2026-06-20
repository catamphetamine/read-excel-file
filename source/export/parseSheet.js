import parseSpreadsheetContents from '../xlsx/parseSpreadsheetContents.js'
import parseSheetData from '../parseSheetData/parseSheetData.js'

/**
 * Reads data from a single sheet of an `.xlsx` file as an array of rows (which are arrays of cells) or as an array of objects (if `options.schema` was passed).
 * @param  {Record<string,string>} contents - A map of `.xml` files inside the `.xlsx` file (which itself is just a zipped directory).
 * @param  {function} parseXmlTree — Parses an XML string into a DOM tree.
 * @param  {function} [parseXmlStream] — (optional) "streaming" XML parser. Using "streaming" also requires Node.js because it uses Node.js streams.
 * @param  {string|number} [sheet] — Sheet name or number.
 * @param  {object} [options]
 * @return {Promise<SheetData>}
 */
export default function parseSheet(contents, parseXmlTree, parseXmlStream, sheet, options) {
	return parseSpreadsheetContents(contents, parseXmlTree, parseXmlStream, {
		...options,
		sheets: [sheet === undefined ? 1 : sheet]
	}).then((sheets) => {
		const sheetData = sheets[0].data
		if (options && options.schema) {
			return parseSheetData(sheetData, options.schema)
		}
		return sheetData
	})
}