// Uses an "async" function of the unzipper function
// just because it feels more correct to use it over the "sync" one
// because it isn't supposed to ever freeze the "main thread" (GUI).
//
// import unzipFromArrayBufferSync from '../zip/unzipFromArrayBufferSync.js'
import unzipFromArrayBuffer from '../zip/unzipFromArrayBuffer.js'

import convertValuesFromUint8ArraysToStrings from './convertValuesFromUint8ArraysToStrings.js'
import filterZipArchiveEntry from './filterZipArchiveEntry.js'
/**
 * Unpacks `*.xlsx` file contents, because it's just a `*.zip` archive.
 * @param  {(File|Blob|ArrayBuffer)} input
 * @return {Promise<Record<string,string>} Resolves to an object holding `*.xlsx` file entries.
 */
export default function unpackXlsxFile(input) {
	if (input instanceof File || input instanceof Blob) {
		return input.arrayBuffer().then(getResultFromArrayBuffer)
	}
	return Promise.resolve(input).then(getResultFromArrayBuffer)
}

function getResultFromArrayBuffer(arrayBuffer) {
	return unzipFromArrayBuffer(arrayBuffer, { filter: filterZipArchiveEntry }).then(
		convertValuesFromUint8ArraysToStrings
	)
}

// function getResultFromArrayBufferSync(arrayBuffer) {
//  const result = unzipFromArrayBufferSync(arrayBuffer, { filter: filterZipArchiveEntry })
// 	return convertValuesFromUint8ArraysToStrings(result)
// }