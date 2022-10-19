import { unzipSync, strFromU8 } from 'fflate'

/**
 * Reads XLSX file in a browser.
 * @param  {(File|Blob|ArrayBuffer)} input - A `File` or an `ArrayBuffer`.
 * @return {Promise} Resolves to an object holding XLSX file entries.
 */
export default function unpackXlsxFile(input) {
	if (input instanceof File) {
		return input.arrayBuffer().then(unpackXlsxArrayBuffer)
	}
	if (input instanceof Blob) {
		return input.arrayBuffer().then(unpackXlsxArrayBuffer)
	}
	return unpackXlsxArrayBuffer(input)
}

/**
 * Reads XLSX file in a browser from an `ArrayBuffer`.
 * @param  {ArrayBuffer} input
 * @return {Promise} Resolves to an object holding XLSX file entries.
 */
function unpackXlsxArrayBuffer(arrayBuffer) {
	const archive = new Uint8Array(arrayBuffer)
	const contents = unzipSync(archive)
	return Promise.resolve(getContents(contents))
	// return new Promise((resolve, reject) => {
	// 	unzip(archive, (error, contents) => {
	// 		if (error) {
	// 			return reject(error)
	// 		}
	// 		return resolve(getContents(contents))
	// 	})
	// })
}

function getContents(contents) {
	const unzippedFiles = []
	for (const key of Object.keys(contents)) {
		unzippedFiles[key] = strFromU8(contents[key])
	}
	return unzippedFiles
}