import unpackXlsxFile from './unpackXlsxFileBrowser'
import xml from './xmlBrowser'
import readXlsx from './readXlsx'

/**
 * Reads XLSX file into a 2D array of cells in a browser.
 * @param  {file} file - A file being uploaded in the browser.
 * @param  {string?} sheet - Excel document sheet to read. Defaults to `1`. Will only read this sheet and skip others.
 * @return {Promise} Resolves to a 2D array of cells: an array of rows, each row being an array of cells.
 */
export default function readXlsxFile(file, sheet) {
	return unpackXlsxFile(file, sheet).then(entries => readXlsx(entries, xml))
}