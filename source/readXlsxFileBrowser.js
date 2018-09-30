import unpackXlsxFile from './unpackXlsxFileBrowser'
import xml from './xmlBrowser'
import readXlsxFileContents from './readXlsxFileContents'

/**
 * Reads XLSX file into a 2D array of cells in a browser.
 * @param  {file} file - A file being uploaded in the browser.
 * @param  {object?} options
 * @param  {(number|string)?} options.sheet - Excel document sheet to read. Defaults to `1`. Will only read this sheet and skip others.
 * @return {Promise} Resolves to a 2D array of cells: an array of rows, each row being an array of cells.
 */
export default function readXlsxFile(file, options = {}) {
	return unpackXlsxFile(file)
		.then((entries) => readXlsxFileContents(entries, xml, options))
}