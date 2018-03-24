import unpackXlsxFile from './unpackXlsxFileBrowser'
import xml from './xmlBrowser'
import readXlsx from './readXlsx'
import convertToJson from './convertToJson'

/**
 * Reads XLSX file into a 2D array of cells in a browser.
 * @param  {file} file - A file being uploaded in the browser.
 * @param  {object?} options
 * @param  {string?} options.sheet - Excel document sheet to read. Defaults to `1`. Will only read this sheet and skip others.
 * @return {Promise} Resolves to a 2D array of cells: an array of rows, each row being an array of cells.
 */
export default function readXlsxFile(file, options = {}) {
	// Deprecated 1.0.0 `sheet` argument. Will be removed in some next major release.
	if (typeof options === 'string' || typeof options === 'number') {
		options = { sheet: options }
	} else if (!options.sheet) {
		options.sheet = 1
	}
	return unpackXlsxFile(file, options)
		.then(entries => readXlsx(entries, xml))
		.then((rows) => {
			if (options.schema) {
				return convertToJson(rows, options.schema, options)
			}
			return rows
		})
}