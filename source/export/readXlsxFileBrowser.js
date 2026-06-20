import parseXmlTree from '../xml/parseXmlTreeBrowser.js'
import parseXmlStream from '../xml/parseXmlStream.js'

import unpackXlsxFile from './unpackXlsxFileBrowser.js'
import parseSpreadsheetContents from '../xlsx/parseSpreadsheetContents.js'

/**
 * Reads an `.xlsx` file.
 * @param  {(File|Blob|ArrayBuffer)} input
 * @param  {object} [options]
 * @return {Promise<Sheet[]>}
 */
export default function readXlsxFile(input, options) {
	return unpackXlsxFile(input)
		.then((contents) => parseSpreadsheetContents(contents, parseXmlTree, parseXmlStream, options))
}