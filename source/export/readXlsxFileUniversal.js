import parseXmlTree from '../xml/parseXmlTreeUniversal.js'
import parseXmlStream from '../xml/parseXmlStream.js'

import unpackXlsxFile from './unpackXlsxFileUniversal.js'
import parseSpreadsheetContents from '../xlsx/parseSpreadsheetContents.js'

/**
 * Reads an `.xlsx` file.
 * @param  {(Blob|ArrayBuffer)} input
 * @param  {object} [options]
 * @return {Promise<Sheet[]>}
 */
export default function readXlsxFile(input, options) {
	return unpackXlsxFile(input)
		.then((contents) => parseSpreadsheetContents(contents, parseXmlTree, parseXmlStream, options))
}