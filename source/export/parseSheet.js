import parseSpreadsheetContents from '../xlsx/parseSpreadsheetContents.js'

export default function parseSheet(contents, xml, sheet, options) {
	return parseSpreadsheetContents(contents, xml, {
		...options,
		sheets: [sheet === undefined ? 1 : sheet]
	})[0].data
}