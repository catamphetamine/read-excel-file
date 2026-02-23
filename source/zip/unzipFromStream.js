import { Buffer } from 'buffer'

// `unzipper` has a bug when it doesn't include "@aws-sdk/client-s3" package in the `dependencies`
// which causes some "bundlers" throw an error.
// https://github.com/ZJONSSON/node-unzipper/issues/330
//
// One workaround is to install "@aws-sdk/client-s3" package manually, which would still lead to increased bundle size.
// If the code is bundled for server-side-use only, that is will not be used in a web browser,
// then the increased bundle size would not be an issue.
//
// Another workaround could be to "alias" "@aws-sdk/client-s3" package in a "bundler" configuration file
// with a path to a `*.js` file containing just "export default null". But that kind of a workaround would also
// result in errors when using other packages that `import` anything from "@aws-sdk/client-s3" package,
// so it's not really a workaround but more of a ticking bomb.
//
import unzip from 'unzipper'

// Althernatively, it could use `fflate` if someone writes an example of handling a Node.js stream.
// https://github.com/101arrowz/fflate/issues/251

/**
 * Reads `*.zip` file contents.
 * @param  {Stream} stream
 * @return {Promise<Record<string,Buffer>>} Resolves to an object holding `*.zip` file entries. P.S. `Buffer` is a `Uint8Array`.
 */
export default function unzipFromStream(stream, { filter } = {}) {
	// The `files` object stores the files and their contents.
	const files = {}

	return new Promise((resolve, reject) => {
		const promises = []

		let errored = false

		const onError = (error) => {
			if (!errored) {
				errored = true
				reject(error)
			}
		}

		stream
			// This first "error" listener catches the original stream errors.
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
			.pipe(unzip.Parse())
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
						resolve(files)
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
				if (filter) {
					if (!filter({ path: entry.path })) {
						ignore = true
					}
				}

				// If this file should be ignored.
				if (ignore) {
					// Call `entry.autodrain()` when you do not intend to process a specific `entry`'s raw data.
					// Otherwise, if an `entry` is not consumed (via .pipe(), .buffer(), or .autodrain()),
					// the stream will halt, preventing further file processing.
					entry.autodrain().on('error', onError)
					return
				}

				const chunks = []

				promises.push(new Promise((resolve) => {
					// `entry` seems to be a generic Node.js stream.
					// `entry.pipe()` pipes the file contents to a stream.
					// `entry.stream()` returns a readable stream.
					// `entry.buffer()` returns a promise that resolves to a `Buffer` with the file contents.
					entry
						.on('data', (data) => {
							chunks.push(data)
						})
						.on('error', (error) => {
							onError(error)
						})
						.on('finish', () => {
							files[entry.path] = Buffer.concat(chunks)
							resolve()
						})
				}))
			})
	})
}