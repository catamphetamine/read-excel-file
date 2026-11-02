// This is a legacy export. Use the `/browser` export instead.
// The reason why this export existed is because the `/browser` export
// used to be incompatible with web workers. Not anymore.

// Unzipper is multi-threaded and it spawns a separate worker for each individual file
// inside the archive that is large-enough to justify spawning a worker.
// Because it uses its own `Worker` implementation, it won't use `createWorkerFunction()`.
//
// XML parser is itself single-threaded but it could spawn a separate worker for each
// individual `.xml` file that is large-enough to justify spawning a worker.
// So it could use `createWorkerFunction()`.
//
import createWorkerFunction from 'worker-f/browser'

import parseXml from '../xml/parseXml.js'
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
		.then((contents) => parseSpreadsheetContents(createWorkerFunction, parseXml, contents, options))
}