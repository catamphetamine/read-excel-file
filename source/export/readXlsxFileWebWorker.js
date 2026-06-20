import parseXmlTree from '../xml/parseXmlTreeUniversal.js'
import parseXmlStream from '../xml/parseXmlStream.js'

import unpackXlsxFile from './unpackXlsxFileBrowser.js'
import parseSpreadsheetContents from '../xlsx/parseSpreadsheetContents.js'

/**
 * Reads an `.xlsx` file.
 * @param  {(File|Blob|ArrayBuffer)} input
 * @param  {object} [options]
 * @return {Promise<Sheet[]>}
 */
export default function readXlsxFile(file, options) {
	return unpackXlsxFile(file)
		.then((contents) => parseSpreadsheetContents(contents, parseXmlTree, parseXmlStream, options))
}