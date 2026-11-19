// Here it uses the "async" version of the unzipper function
// just because it unzips the files inside an archive in parallel
// rather than sequentially. It uses web workers for that.
// Smaller files are still handled synchronously under the hood.
//
// It did condict a couple of basic manual tests in a web browser
// and the results showed that a `1 MB` `.xlsx` file is read in `100 ms`
// both using "sync" and "async" versions of the unzipper function,
// and reading a `200 KB` `.xlsx` file is done in `70 ms` when using
// the "sync" version and in `80 ms" when using the "async" verison.
//
// So the "sync" version of the unzipper function is faster on smaller file sizes
// of about < 1 MB. Still, the rest of the parsing code smoothes out this difference,
// and the end result is not much different. Does the difference of `10 ms` justify
// the mental overhead of choosing the right variant for a file of a given size?
// I'd say "not really". Sure, performance fans wouldn't scuff on those `10 ms`
// but it's literally "a blink of an eye" and about a duration of a single frame
// on a 120 FPS screen.
//
// Hence, it simply uses the "async" variant of the unzipper function in any case.
//
// import unzipFromUint8ArraySync from '../zip/unzipFromUint8ArraySync.js'
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
 * @param  {(File|Blob|ArrayBuffer|ArrayBufferView)} input
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
	if (input instanceof File || input instanceof Blob) {
		return input.arrayBuffer().then(convertArrayBufferOrArrayBufferViewToUint8Array)
	}
	if (input instanceof ArrayBuffer || ArrayBuffer.isView(input)) {
		return Promise.resolve(convertArrayBufferOrArrayBufferViewToUint8Array(input))
	}
	return Promise.reject(new InvalidInputError('INPUT_TYPE_NOT_SUPPORTED'))
}