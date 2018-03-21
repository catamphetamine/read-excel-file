import unpackXlsxFile from './unpackXlsxFileNode'
import readXlsx from './readXlsx'

/**
 * Reads XLSX file into a 2D array of cells in a browser.
 * @param  {(string|Stream)} input - A Node.js readable stream or a path to a file.
 * @param  {string?} sheet - Excel document sheet to read. Defaults to `1`. Will only read this sheet and skip others.
 * @return {Promise} Resolves to a 2D array of cells: an array of rows, each row being an array of cells.
 */
export default function readXlsxFile(input, sheet) {
	return unpackXlsxFile(input, sheet).then(readXlsx)
}