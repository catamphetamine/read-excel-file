import readXlsxFile from './readXlsxFileBrowser.js'

/**
 * Reads the list of sheet names in an XLSX file.
 * @param  {(File|Blob|ArrayBuffer)} input
 * @return {Promise} Resolves to an array of objects of shape `{ name: string }`.
 */
export default function readSheetNames(input) {
	return readXlsxFile(input, { getSheets: true })
		.then(sheets => sheets.map(sheet => sheet.name))
}