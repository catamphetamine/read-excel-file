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
// import unzipFromArrayBufferSync from '../zip/unzipFromArrayBufferSync.js'
import unzipFromArrayBuffer from '../zip/unzipFromArrayBuffer.js'

import convertValuesFromUint8ArraysToStrings from './convertValuesFromUint8ArraysToStrings.js'
import filterZipArchiveEntry from './filterZipArchiveEntry.js'

import checkpoint, { resetCheckpoint } from '../utility/checkpoint.js'

/**
 * Unpacks `*.xlsx` file contents.
 * An `.xlsx` file is really just a `.zip` archive with `.xml` files inside.
 * @param  {(File|Blob|ArrayBuffer)} input
 * @return {Promise<Record<string,string>} Resolves to an object holding `*.xlsx` file entries.
 */
export default function unpackXlsxFile(input) {
	resetCheckpoint()
	checkpoint('unpack files')
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

// function getResultFromArrayBuffer(arrayBuffer) {
// 	const result = unzipFromArrayBufferSync(arrayBuffer, { filter: filterZipArchiveEntry })
// 	return Promise.resolve(convertValuesFromUint8ArraysToStrings(result))
// }