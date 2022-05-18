import xml from '../xml/xml.js'

import unpackXlsxFile from './unpackXlsxFileBrowser.js'
import readXlsxFileContents from './readXlsxFileContents.js'

/**
 * Reads XLSX file into a 2D array of cells in a web worker.
 * @param  {file} file - The file.
 * @param  {object?} options
 * @param  {(number|string)?} options.sheet - Excel document sheet to read. Defaults to `1`. Will only read this sheet and skip others.
 * @return {Promise} Resolves to a 2D array of cells: an array of rows, each row being an array of cells.
 */
export default function readXlsxFile(file, options = {}) {
	return unpackXlsxFile(file)
		.then((entries) => readXlsxFileContents(entries, xml, options))
}