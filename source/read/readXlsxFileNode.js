import xml from '../xml/xml.js'

import unpackXlsxFile from './unpackXlsxFileNode.js'
import readXlsxFileContents from './readXlsxFileContents.js'

/**
 * Reads XLSX file into a 2D array of cells in a browser.
 * @param  {(string|Stream|Buffer)} input - A Node.js readable stream or a `Buffer` or a path to a file.
 * @param  {object?} options
 * @param  {(number|string)?} options.sheet - Excel document sheet to read. Defaults to `1`. Will only read this sheet and skip others.
 * @return {Promise} Resolves to a 2D array of cells: an array of rows, each row being an array of cells.
 */
export default function readXlsxFile(input, options = {}) {
	return unpackXlsxFile(input)
		.then((entries) => readXlsxFileContents(entries, xml, options))
}