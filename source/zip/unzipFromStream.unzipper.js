// Considerations:
//
// * `unzipper` unpacks a `.zip` file using Node.js's "native" `zlib` module.
//   This means that it's more performant than any equivalent pure-javascript decompressor.
//
// * `unzipper` is a true "streaming" unpacker: it works in a "pull" fashion rather than a "push" one.
//   New chunks of archived data are only read and decompressed as the receiver is ready to process them.
//
// * `unzipper` can completely skip a given compressed file entry if it's of no interest.
//   This means that a `.zip` archive could be read in multiple passes without performance penalty.

import { Parse, ZipFileError } from 'unzipper-esm'

import { createUnzipError } from './UnzipError.js'

const PROMISE_RESOLVE_VALUE = undefined

/**
 * Reads `*.zip` file contents.
 * @param  {Stream} stream
 * @param  {function} onFile
 * @param  {function} onFileData
 * @param  {function} onFileDataEnd
 * @return {Promise<void>}
 */
export default function unzipFromStream_(stream, onFile, onFileData, onFileDataEnd) {
	return new Promise((resolve, reject) => {
		const promises = []

		let errored = false

		const onError = (error) => {
			if (error instanceof ZipFileError) {
				error = createUnzipError(error)
			}
			if (!errored) {
				errored = true
				reject(error)
			}
		}

		stream
			// This first "error" listener catches errors emitted from the input stream (for example, a file read error).
			//
			// That's because the .pipe() method does not automatically propagate errors
			// from a source (input) stream to the destination stream or the end of the pipeline.
			// You would need to attach an 'error' event handler to each stream in the chain.
			//
			// A more convenient alternative would be to use `stream.pipeline()` function:
			// `pipeline(stream1, stream2, (error) => { ... })`
			//
			.on('error', onError)
			// Pipe the input stream through the unzipper stream.
			.pipe(Parse())
			// This second "error" listener catches the unzipper stream errors.
			//
			// That's because the .pipe() method does not automatically propagate errors
			// from a source (input) stream to the destination stream or the end of the pipeline.
			// You would need to attach an 'error' event handler to each stream in the chain.
			//
			// A more convenient alternative would be to use `stream.pipeline()` function:
			// `pipeline(stream1, stream2, (error) => { ... })`
			//
			.on('error', onError)
			// The unzipper stream is closed when all `entries` have been reported.
			.on('finish', () => {
				if (!errored) {
					// Wait for all `entries` to be read.
					// The second argument of `.then()` function is not required
					// but I didn't remove it just to potentially prevent any potential silly bugs
					// in case of some potential changes in some potential future.
					Promise.all(promises).then(() => {
						resolve(PROMISE_RESOLVE_VALUE)
					}, onError)
				}
			})
			.on('entry', (entry) => {
				// See if this file should be ignored.
				let ignore = false
				// `entry.type` could be 'Directory' or 'File'.
				// Ignore anything except files.
				if (entry.type === 'Directory') {
					ignore = true
				}
				if (errored) {
					ignore = true
				}
				if (onFile(entry.path) === false) {
					ignore = true
				}

				// If this file should be ignored.
				if (ignore) {
					// Call `entry.autodrain()` when you do not intend to process a specific `entry`'s raw data.
					// Otherwise, if an `entry` is not consumed (via .pipe(), .buffer(), or .autodrain()),
					// the stream will halt, preventing further file processing.
					entry.autodrain().on('error', onError)
					return
				}

				promises.push(new Promise((resolve) => {
					// `entry` seems to be a generic Node.js stream.
					// `entry.pipe()` pipes the file contents to a stream.
					// `entry.stream()` returns a readable stream.
					// `entry.buffer()` returns a promise that resolves to a `Buffer` with the file contents.
					entry
						.on('data', (data) => {
							onFileData(entry.path, data)
						})
						.on('error', (error) => {
							onError(error)
						})
						.on('finish', () => {
							onFileDataEnd(entry.path)
							resolve()
						})
				}))
			})
	})
}