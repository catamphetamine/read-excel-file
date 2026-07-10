// import createWorkerFunction from 'worker-f/browser'

import parseXmlStream from '../xml/parseXmlStream.js'
import unpackXlsxFile from './unpackXlsxFileBrowser.js'

import parseSpreadsheetContents from '../xlsx/parseSpreadsheetContents.js'

const createWorkerFunction = undefined

/**
 * Reads an `.xlsx` file.
 * @param  {(File|Blob|ArrayBuffer)} input
 * @param  {object} [options]
 * @return {Promise<Sheet[]>}
 */
export default function readXlsxFile(input, options) {
	return unpackXlsxFile(input)
		.then((contents) => parseSpreadsheetContents(createWorkerFunction, parseXmlStream, contents, options))
}