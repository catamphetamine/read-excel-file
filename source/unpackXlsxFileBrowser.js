import { loadAsync } from 'jszip'

import { getXlsxEntryKey } from './readXlsxFileHelpers'

/**
 * Reads XLSX file in a browser.
 * @param  {file} file - A file being uploaded in the browser.
 * @param  {string?} sheet - Excel document sheet to read. Defaults to `1`. Will only read this sheet and skip others.
 * @return {Promise} Resolves to an object holding XLSX file entries.
 */
export default function unpackXlsxFile(file, sheet = '1') {
	const files = {}

	return loadAsync(file).then((zip) => {
		const files = []
		zip.forEach((relativePath, zipEntry) => {
			if (getXlsxEntryKey(zipEntry.name, sheet)) {
				files.push(zipEntry.name)
			}
		})

		const entries = {}
		return Promise.all(files.map((file) => {
			return zip.file(file).async('string').then((text) => {
				entries[getXlsxEntryKey(file, sheet)] = text
			})
		}))
		.then(() => entries)
	})
}