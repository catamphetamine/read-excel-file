import unzipFromUint8Array from '../zip/unzipFromUint8Array.js'
import UnzipError from '../zip/UnzipError.js'
import InvalidInputError from '../xlsx/file/InvalidInputError.js'
import filterZipArchiveEntry from './filterZipArchiveEntry.js'
import validateLeadingBytes from '../xlsx/file/validateLeadingBytes.js'
import convertArrayBufferOrArrayBufferViewToUint8Array from '../utility/convertArrayBufferOrArrayBufferViewToUint8Array.js'

import checkpoint, { resetCheckpoint } from '../utility/checkpoint.js'

/**
 * Unpacks `*.xlsx` file contents.
 * An `.xlsx` file is really just a `.zip` archive with `.xml` files inside.
 * @param  {(Blob|ArrayBuffer|ArrayBuffer)} input
 * @return {Promise<Record<string,Uint8Array>} Resolves to an object holding `*.xlsx` file entries.
 */
export default function unpackXlsxFile(input) {
	resetCheckpoint()
	checkpoint('unpack files')
	return getUint8Array(input).then((uint8Array) => {
		validateLeadingBytes(uint8Array)
		return unzipFromUint8Array(uint8Array, { filter: filterZipArchiveEntry })
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

function getUint8Array(input) {
	if (input instanceof Blob) {
		return input.arrayBuffer().then(convertArrayBufferOrArrayBufferViewToUint8Array)
	}
	if (input instanceof ArrayBuffer || ArrayBuffer.isView(input)) {
		return Promise.resolve(convertArrayBufferOrArrayBufferViewToUint8Array(input))
	}
	return Promise.reject(new InvalidInputError('INPUT_TYPE_NOT_SUPPORTED'))
}