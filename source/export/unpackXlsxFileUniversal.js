import unzipFromArrayBuffer from '../zip/unzipFromArrayBuffer.js'
import convertValuesFromUint8ArraysToStrings from './convertValuesFromUint8ArraysToStrings.js'
import filterZipArchiveEntry from './filterZipArchiveEntry.js'

/**
 * Unpacks `*.xlsx` file contents, because it's just a `*.zip` archive.
 * @param  {Blob} input
 * @return {Promise<Record<string,string>} Resolves to an object holding `*.xlsx` file entries.
 */
export default function unpackXlsxFile(input) {
	return input.arrayBuffer()
		.then(arrayBuffer => unzipFromArrayBuffer(arrayBuffer, { filter: filterZipArchiveEntry }))
		.then(convertValuesFromUint8ArraysToStrings)
}