import xml from '../xml/xmlBrowser.js'

import unpackXlsxFile from './unpackXlsxFileBrowser.js'
import parseSpreadsheetContents from '../xlsx/parseSpreadsheetContents.js'

/**
 * Reads an `.xlsx` file.
 * @param  {(File|Blob|ArrayBuffer)} input
 * @param  {object} [options]
 * @return {Promise<ReadFileResult>}
 */
export default function readXlsxFile(input, options) {
	return unpackXlsxFile(input)
		.then((contents) => parseSpreadsheetContents(contents, xml, options))
}