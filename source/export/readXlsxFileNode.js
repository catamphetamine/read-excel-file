// import createWorkerFunction from 'worker-f/node'

import parseXmlStream from '../xml/parseXmlStream.js'
import unpackXlsxFile from './unpackXlsxFileNode.js'

import parseSpreadsheetContents from '../xlsx/parseSpreadsheetContents.js'

const createWorkerFunction = undefined

/**
 * Reads an `.xlsx` file.
 * @param  {(string|Stream|Buffer|Blob)} input
 * @param  {object} [options]
 * @return {Promise<Sheet[]>}
 */
export default function readXlsxFile(input, options) {
	return unpackXlsxFile(input)
		.then((contents) => parseSpreadsheetContents(createWorkerFunction, parseXmlStream, contents, options))
}