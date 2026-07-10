import parseXmlStream from '../xml/parseXmlStream.js'
import unpackXlsxFile from './unpackXlsxFileUniversal.js'

import parseSpreadsheetContents from '../xlsx/parseSpreadsheetContents.js'

// There seems to be no way to access Node.js `Worker`
// other than explicitly `import`ing it from the "worker_threads" module.
// It's in contrast to web browsers where the `Worker` class is accessible through a global variable.
//
// The requirement for an explicit `import` of a "native" module in Node.js
// means that it's not really possible to write a "universal" worker implementation
// because what works in Node.js won't work in a web browser due to the absence of the "native" module.
//
// So there seems to be no way to use `Worker` in a "universal" export.
//
const createWorkerFunction = undefined

/**
 * Reads an `.xlsx` file.
 * @param  {(Blob|ArrayBuffer)} input
 * @param  {object} [options]
 * @return {Promise<Sheet[]>}
 */
export default function readXlsxFile(input, options) {
	return unpackXlsxFile(input)
		.then((contents) => parseSpreadsheetContents(createWorkerFunction, parseXmlStream, contents, options))
}