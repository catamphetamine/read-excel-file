// `fflate` uses "synchronous" decompressor on `.zip` files that're under `512KB`
// (or when the compression level is too low), and an "asynchronous" (web worker)
// decompressor otherwise, as it can be seen from the source code of the `unzip()` function.
// This is because using web workers comes with an overhead of
// both creating a new worker and sending data back and forth.
//
import { unzip } from 'fflate'

/**
 * Reads `*.zip` file contents. Ignores anything besides `.xml` or `.xml.rels` files.
 * @param  {ArrayBuffer} input
 * @return {Promise<Record<string,Uint8Array>>} Resolves to an object holding `*.zip` file entries.
 */
export default function unzipFromArrayBuffer(input, options) {
	return unzipFromArrayBufferUsingFunction(input, options, unzipAsync, true)
}

/**
 * Reads `*.zip` file contents. Ignores anything besides `.xml` or `.xml.rels` files.
 * @param  {ArrayBuffer} input
 * @param  {(ArrayBuffer) => Record<string, Uint8Array> | Promise<Record<string, Uint8Array>>} unzip
 * @param  {boolean} isAsync — Should be `true` when `unzip()` returns a `Promise`, `false` otherwise.
 * @return {Promise<Record<string,Uint8Array>>|Record<string,Uint8Array>} Resolves to an object holding `*.zip` file entries.
 */
export function unzipFromArrayBufferUsingFunction(input, { filter } = {}, unzip, isAsync) {
	// Read the `.zip` archive.
	// `result` is either `object` or `Promise<object>`
	return unzip(new Uint8Array(input), {
		// Ignore certain types of files.
		filter: (file) => {
			if (filter) {
				return filter({
					path: file.name
				})
			}
			return true
		}
	})
}

function unzipAsync(archive) {
  return new Promise((resolve, reject) => {
		// `unzip()` will resort to "synchronous" decompression in two edge cases:
    // * When the archive size is less than `512KB`.
    // * When the data is barely compressed, i.e. the compression ratio is less than 20% reduction in size.
    unzip(archive, (error, files) => {
      if (error) {
        reject(error)
      } else {
        resolve(files)
      }
    })
  })
}