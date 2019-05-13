import unpackXlsxFile from './unpackXlsxFileBrowser'
// Turns out IE11 doesn't support XPath, so not using the native `DOMParser` here.
// https://github.com/catamphetamine/read-excel-file/issues/26
// The bundle size with `./xmlBrowser` is 190 kilobytes,
// the bundle size with `./xmlNode` is 290 kilobytes,
// so `./xmlBrowser` polyfill is about 100 kilobytes in size.
// Still, IE11 is a wide-spread browser and it's unlikely that
// anyone would ignore it for now.
// import xml from './xmlBrowser'
import xml from './xmlNode'
import readXlsxFileContents from './readXlsxFileContents'

/**
 * Reads XLSX file into a 2D array of cells in a browser.
 * @param  {file} file - A file being uploaded in the browser.
 * @param  {object?} options
 * @param  {(number|string)?} options.sheet - Excel document sheet to read. Defaults to `1`. Will only read this sheet and skip others.
 * @return {Promise} Resolves to a 2D array of cells: an array of rows, each row being an array of cells.
 */
export default function readXlsxFile(file, options = {}) {
	return unpackXlsxFile(file)
		.then((entries) => readXlsxFileContents(entries, xml, options))
}