import unzipFromArrayBuffer from '../zip/unzipFromArrayBuffer.js'
import convertValuesFromUint8ArraysToStrings from './convertValuesFromUint8ArraysToStrings.js'
import filterZipArchiveEntry from './filterZipArchiveEntry.js'

/**
 * Unpacks `*.xlsx` file contents.
 * An `.xlsx` file is really just a `.zip` archive with `.xml` files inside.
 * @param  {(Blob|ArrayBuffer)} input
 * @return {Promise<Record<string,string>} Resolves to an object holding `*.xlsx` file entries.
 */
export default function unpackXlsxFile(input) {
	return getArrayBuffer(input)
		.then(arrayBuffer => unzipFromArrayBuffer(arrayBuffer, { filter: filterZipArchiveEntry }))
		.then(convertValuesFromUint8ArraysToStrings)
}

function getArrayBuffer(input) {
	if (input instanceof Blob) {
		return input.arrayBuffer()
	}
	if (input instanceof ArrayBuffer) {
		return Promise.resolve(input)
	}
	throw new TypeError('Unuspported input. Expected a `Blob` or an `ArrayBuffer`')
}