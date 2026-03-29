import xml from '../xml/xml.js'

import unpackXlsxFile from './unpackXlsxFileUniversal.js'
import parseSpreadsheetContents from '../xlsx/parseSpreadsheetContents.js'

/**
 * Reads an `.xlsx` file.
 * @param  {(Blob|ArrayBuffer)} input
 * @param  {object} [options]
 * @return {Promise<ReadFileResult>}
 */
export default function readXlsxFile(input, options) {
	return unpackXlsxFile(input)
		.then((contents) => parseSpreadsheetContents(contents, xml, options))
}