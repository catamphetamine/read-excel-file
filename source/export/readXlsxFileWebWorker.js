// import createWorkerFunction from 'worker-f/browser'

import parseXmlStream from '../xml/parseXmlStream.js'

import unpackXlsxFile from './unpackXlsxFileBrowser.js'
import parseSpreadsheetContents from '../xlsx/parseSpreadsheetContents.js'

// Unzipper is multi-threaded and it spawns a separate worker for each individual file
// inside the archive that is large-enough to justify spawning a worker.
//
// XML parser is itself single-threaded but it could spawn a separate worker for each
// individual `.xml` file that is large-enough to justify spawning a worker.
//
const createWorkerFunction = undefined

/**
 * Reads an `.xlsx` file.
 * @param  {(File|Blob|ArrayBuffer)} input
 * @param  {object} [options]
 * @return {Promise<Sheet[]>}
 */
export default function readXlsxFile(file, options) {
	return unpackXlsxFile(file)
		.then((contents) => parseSpreadsheetContents(createWorkerFunction, parseXmlStream, contents, options))
}