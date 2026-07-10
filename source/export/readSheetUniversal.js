import parseXmlStream from '../xml/parseXmlStream.js'
import unpackXlsxFile from './unpackXlsxFileUniversal.js'

import parseSheet from './parseSheet.js'

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
 * Reads a single sheet from an `.xlsx` file.
 * @param  {(Blob|ArrayBuffer)} input
 * @param  {(number|string)} [sheet] — Sheet number or sheet name
 * @param  {object} [options]
 * @return {Promise<SheetData>}
 */
export default function readSheet(input, sheet, options) {
	// `sheet` argument is optional.
	// It could be omitted while `options` argument is passed.
	if (!options && sheet && typeof sheet !== 'number' && typeof sheet !== 'string') {
		options = sheet
		sheet = undefined
	}
	return unpackXlsxFile(input)
		.then((contents) => parseSheet(createWorkerFunction, parseXmlStream, contents, sheet, options))
}