import unzipFromArrayBuffer from '../zip/unzipFromArrayBuffer.js'
import UnzipError from '../zip/UnzipError.js'
import InvalidInputError from '../xlsx/file/InvalidInputError.js'
import filterZipArchiveEntry from './filterZipArchiveEntry.js'
import validateLeadingBytes from '../xlsx/file/validateLeadingBytes.js'
import toUint8Array from '../utility/toUint8Array.js'

import checkpoint, { resetCheckpoint } from '../utility/checkpoint.js'

/**
 * Unpacks `*.xlsx` file contents.
 * An `.xlsx` file is really just a `.zip` archive with `.xml` files inside.
 * @param  {(Blob|ArrayBuffer|ArrayBufferView)} input
 * @return {Promise<Record<string,Uint8Array>} Resolves to an object holding `*.xlsx` file entries.
 */
export default function unpackXlsxFile(input) {
	resetCheckpoint()
	checkpoint('unpack files')
	return getBytes(input).then((bytes) => {
		validateLeadingBytes(bytes)
		return unzipFromArrayBuffer(bytes, { filter: filterZipArchiveEntry })
			.then(
				result => result,
				(error) => {
					if (error instanceof UnzipError) {
						throw new InvalidInputError('INVALID_ZIP', error.cause)
					} else {
						throw error
					}
				}
			)
	})
}

function getBytes(input) {
	if (input instanceof Blob) {
		return input.arrayBuffer().then(toUint8Array)
	}
	if (input instanceof ArrayBuffer || ArrayBuffer.isView(input)) {
		return Promise.resolve(toUint8Array(input))
	}
	throw new InvalidInputError('INPUT_TYPE_NOT_SUPPORTED')
}