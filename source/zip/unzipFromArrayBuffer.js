// `fflate` uses "synchronous" decompressor on `.zip` files that're under `512KB`
// (or when the compression level is too low), and an "asynchronous" (web worker)
// decompressor otherwise, as it can be seen from the source code of the `unzip()` function.
// This is because using web workers comes with an overhead of
// both creating a new worker and sending data back and forth.
//
import { unzip } from 'fflate'

import { createUnzipError } from './UnzipError.js'
import toUint8Array from '../utility/toUint8Array.js'

/**
 * Reads `*.zip` file contents. Ignores anything besides `.xml` or `.xml.rels` files.
 * @param  {(ArrayBuffer|ArrayBufferView)} input
 * @return {Promise<Record<string,Uint8Array>>} Resolves to an object holding `*.zip` file entries.
 */
export default function unzipFromArrayBuffer(input, options) {
	return unzipFromArrayBufferUsingFunction(input, options, unzipAsync, true)
}

/**
 * Reads `*.zip` file contents. Ignores anything besides `.xml` or `.xml.rels` files.
 * @param  {(ArrayBuffer|ArrayBufferView)} input
 * @param  {(Uint8Array) => Record<string, Uint8Array> | Promise<Record<string, Uint8Array>>} unzip
 * @param  {boolean} isAsync — Should be `true` when `unzip()` returns a `Promise`, `false` otherwise.
 * @return {Promise<Record<string,Uint8Array>> | Record<string,Uint8Array>} Resolves to an object holding `*.zip` file entries.
 */
export function unzipFromArrayBufferUsingFunction(input, { filter } = {}, unzip, isAsync) {
	// Read the `.zip` archive.
	// `result` is either `object` or `Promise<object>`
	return unzip(toUint8Array(input), {
		// Ignore certain types of files.
		filter: (file) => {
			if (filter) {
				return filter({
					path: file.name
				})
			}
			return true
		}
	}).then(
		result => result,
		(error) => {
			// If `fflate` throws its specific error then it implies that the `.zip` file is not valid.
			if (isFlateError(error)) {
				throw createUnzipError(error)
			} else {
				throw error
			}
		}
	)
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

// This function attempts to guess if a given `error` was thrown by `fflate`.
function isFlateError(error) {
	// `fflate` doesn't export a `FlateError` class.
	// https://github.com/101arrowz/fflate/issues/290
	// return error instanceof FlateError

	// Here, it attempts to guess if an `error` is a `FlateError` by checking if `error.code` is a `number`.
	return typeof error.code === 'number'
}
