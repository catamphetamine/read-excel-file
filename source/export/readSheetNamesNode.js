import readXlsxFile from './readXlsxFileNode.js'

/**
 * Reads the list of sheet names in an XLSX file in Node.js.
 * @param  {(string|Stream|Buffer)} input - A Node.js readable stream or a `Buffer` or a path to a file.
 * @return {Promise} Resolves to an array of objects of shape `{ name: string }`.
 */
export default function readSheetNames(input) {
	return readXlsxFile(input, { getSheets: true })
		.then(sheets => sheets.map(sheet => sheet.name))
}