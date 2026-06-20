import parseXmlTree from '../xml/parseXmlTreeUniversal.js'
import parseXmlStream from '../xml/parseXmlStream.js'

import unpackXlsxFile from './unpackXlsxFileNode.js'
import parseSpreadsheetContents from '../xlsx/parseSpreadsheetContents.js'

/**
 * Reads an `.xlsx` file.
 * @param  {(string|Stream|Buffer|Blob)} input
 * @param  {object} [options]
 * @return {Promise<Sheet[]>}
 */
export default function readXlsxFile(input, options) {
	return unpackXlsxFile(input)
		.then((contents) => parseSpreadsheetContents(contents, parseXmlTree, parseXmlStream, options))
}