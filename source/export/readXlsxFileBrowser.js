import createWorkerFunction from 'worker-f/browser'

import parseXml from '../xml/parseXml.js'
import unpackXlsxFile from './unpackXlsxFileBrowser.js'

import parseSpreadsheetContents from '../xlsx/parseSpreadsheetContents.js'

/**
 * Reads an `.xlsx` file.
 * @param  {(File|Blob|ArrayBuffer|ArrayBufferView)} input
 * @param  {object} [options]
 * @return {Promise<Sheet[]>}
 */
export default function readXlsxFile(input, options) {
	return unpackXlsxFile(input)
		.then((contents) => parseSpreadsheetContents(createWorkerFunction, parseXml, contents, options))
}