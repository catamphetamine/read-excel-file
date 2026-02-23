// `fflate` readme is too complicated:
// https://github.com/101arrowz/fflate/issues/251
// I just used whatever approach seemed to work.
//
// It was a choice between "syncrhonous" (blocking) unzip via `unzipSync()`
// and "asynchronous" (non-blocking) unzip via `unzip()`.
//
// In the readme they say that using "asynchronous" API  will cause the compression or decompression
// run in a separate thread by using Web (or Node) Workers, so it won't block the main thread.
// Yet, they also say that there is an initial overhead to using workers of about 50ms for each
// asynchronous function. For small (under about 50kB) payloads, they say that the "asynchronous" API
// will be much slower compared to the "synchronous" one. However, when compressing larger files
// or multiple files at once, the "synchronous" API causes the main thread to hang for too long,
// and the "asynchronous" API is an order of magnitude better.
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