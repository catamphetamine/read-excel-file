import xml from '../xml/xml.js'

import unpackXlsxFile from './unpackXlsxFileUniversal.js'
import parseXlsxFileContents from '../xlsx/parseXlsxFileContentsWithOptionalSchema.js'

/**
 * Reads XLSX file into a 2D array of cells.
 * @param  {(Blob)} input
 * @param  {object?} options
 * @param  {(number|string)?} options.sheet - Excel document sheet to read. Defaults to `1`. Will only read this sheet and skip others.
 * @return {Promise} Resolves to a 2D array of cells: an array of rows, each row being an array of cells.
 */
export default function readXlsxFile(input, options = {}) {
	return unpackXlsxFile(input)
		.then((contents) => parseXlsxFileContents(contents, xml, options))
}