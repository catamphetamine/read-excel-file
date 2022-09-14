import { unzipSync, strFromU8 } from 'fflate'

/**
 * Reads XLSX file in a browser.
 * @param  {File} file - A `File` object being uploaded in the browser.
 * @return {Promise} Resolves to an object holding XLSX file entries.
 */
export default function unpackXlsxFile(file) {
	const startedAt = Date.now()
	return file.arrayBuffer().then((fileBuffer) => {
		const archive = new Uint8Array(fileBuffer)
		const contents = unzipSync(archive)
		return getContents(contents)
		// return new Promise((resolve, reject) => {
		// 	unzip(archive, (error, contents) => {
		// 		if (error) {
		// 			return reject(error)
		// 		}
		// 		return resolve(getContents(contents))
		// 	})
		// })
	})
}

function getContents(contents) {
	const unzippedFiles = []
	for (const key of Object.keys(contents)) {
		unzippedFiles[key] = strFromU8(contents[key])
	}
	return unzippedFiles
}