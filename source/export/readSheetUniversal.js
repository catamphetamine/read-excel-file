import xml from '../xml/xml.js'

import unpackXlsxFile from './unpackXlsxFileUniversal.js'
import parseSheet from './parseSheet.js'

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
		.then((contents) => parseSheet(contents, xml, sheet, options))
}