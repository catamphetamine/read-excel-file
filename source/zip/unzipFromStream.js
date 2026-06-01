import { Buffer } from 'buffer'

// `fflate`'s `Unzip` is a forward-streaming unzipper: it reads a `.zip` archive
// from its local file headers as bytes arrive, so a Node.js stream is never
// buffered into memory in full. `UnzipInflate` is its `DEFLATE` decompressor.
//
// `Unzip` doesn't speak the Node.js stream interface, though — it has its own
// `push(chunk)` / `onfile` / `entry.ondata` protocol — so this function does the
// plumbing manually: it forwards each chunk from the Node.js stream into
// `unzip.push()` and collects the decompressed entries.
// https://github.com/101arrowz/fflate/issues/251
import { Unzip, UnzipInflate } from 'fflate'

/**
 * Reads `*.zip` file contents.
 * @param  {Stream} stream
 * @return {Promise<Record<string,Buffer>>} Resolves to an object holding `*.zip` file entries. P.S. `Buffer` is a `Uint8Array`.
 */
export default function unzipFromStream(stream, { filter } = {}) {
	// The `files` object stores the files and their contents.
	const files = {}

	return new Promise((resolve, reject) => {
		let errored = false

		const onError = (error) => {
			if (!errored) {
				errored = true
				reject(error)
			}
		}

		// Every `.zip` archive (and therefore every `.xlsx` file) starts with the
		// "PK" magic bytes of a local file header or an end-of-central-directory
		// record. `fflate`'s `Unzip` silently yields zero entries for data that
		// contains no archive headers at all, so validate the magic bytes up front
		// to reject non-zip input with a clear error rather than an empty result.
		const magicBytes = []
		let magicChecked = false
		const checkZipMagicBytes = (chunk) => {
			for (let i = 0; i < chunk.length && magicBytes.length < 2; i++) {
				magicBytes.push(chunk[i])
			}
			if (magicBytes.length === 2) {
				magicChecked = true
				if (magicBytes[0] !== 0x50 || magicBytes[1] !== 0x4B) {
					onError(new Error('Invalid zip data: not a zip archive'))
				}
			}
		}

		// `Unzip` discovers each archive entry from its local file header as the
		// archive bytes are pushed in, calling `onfile` for every entry.
		const unzip = new Unzip((entry) => {
			if (errored) {
				return
			}

			// Skip directory entries (their names end with a slash). Only files
			// are reported, matching the `Record<path, contents>` return type.
			if (entry.name.endsWith('/')) {
				return
			}

			// See if this file should be ignored.
			// Not calling `entry.start()` means the entry is skipped entirely:
			// its data is never decompressed (or even buffered for long).
			if (filter && !filter({ path: entry.name })) {
				return
			}

			const chunks = []

			// `entry.ondata` is called with each decompressed chunk of the entry,
			// and a final time with `isLast === true` once the entry is complete.
			entry.ondata = (error, chunk, isLast) => {
				if (error) {
					return onError(error)
				}
				chunks.push(chunk)
				if (isLast) {
					files[entry.name] = Buffer.concat(chunks)
				}
			}

			// Start decompressing this entry.
			entry.start()
		})

		// Register the `DEFLATE` decompressor (compression method `8`), which is
		// what `.xlsx` archives use. The "stored" method (`0`, no compression) is
		// handled by `fflate` out of the box, so it doesn't need to be registered.
		unzip.register(UnzipInflate)

		stream
			// Catch errors from the source stream (e.g. a file read error).
			.on('error', onError)
			.on('data', (chunk) => {
				if (errored) {
					return
				}
				if (!magicChecked) {
					checkZipMagicBytes(chunk)
					if (errored) {
						return
					}
				}
				try {
					// Push the next archive chunk. `UnzipInflate` is synchronous,
					// so any entries completed by this chunk have already populated
					// `files` by the time `push()` returns.
					unzip.push(chunk, false)
				} catch (error) {
					onError(error)
				}
			})
			.on('end', () => {
				if (errored) {
					return
				}
				try {
					// Signal the end of the archive and flush any remaining state.
					unzip.push(new Uint8Array(0), true)
					resolve(files)
				} catch (error) {
					onError(error)
				}
			})
	})
}
