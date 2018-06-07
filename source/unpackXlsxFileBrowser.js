import { loadAsync } from 'jszip'

/**
 * Reads XLSX file in a browser.
 * @param  {file} file - A file being uploaded in the browser.
 * @param  {object} options
 * @param  {string?} options.sheet - Excel document sheet to read. Defaults to `1`. Will only read this sheet and skip others.
 * @return {Promise} Resolves to an object holding XLSX file entries.
 */
export default function unpackXlsxFile(file, { sheet }) {
	const files = {}

	return loadAsync(file).then((zip) => {
		const files = []
		zip.forEach((relativePath, zipEntry) => {
			files.push(zipEntry.name)
		})

		const entries = {}
		return Promise.all(files.map((file) => {
			return zip.file(file).async('string').then(content => entries[file] = content)
		}))
		.then(() => entries)
	})
}