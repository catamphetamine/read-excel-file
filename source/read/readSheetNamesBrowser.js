import readXlsxFile from './readXlsxFileBrowser'

/**
 * Reads the list of sheet names in an XLSX file in a web browser.
 * @param  {file} file - A file being uploaded in the browser.
 * @return {Promise} Resolves to an array of objects of shape `{ name: string }`.
 */
export default function readSheetNames(file) {
	return readXlsxFile(file, { getSheets: true })
		.then(sheets => sheets.map(sheet => sheet.name))
}