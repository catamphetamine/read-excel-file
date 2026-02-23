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
import { unzipSync } from 'fflate'

import { unzipFromArrayBufferUsingFunction } from './unzipFromArrayBuffer.js'

/**
 * Reads `*.zip` file contents. Ignores anything besides `.xml` or `.xml.rels` files.
 * @param  {ArrayBuffer} input
 * @return {Record<string,Uint8Array>} An object holding `*.zip` file entries.
 */
export default function unzipFromArrayBufferSync(input, options) {
	return unzipFromArrayBufferUsingFunction(input, options, unzipSync, true)
}