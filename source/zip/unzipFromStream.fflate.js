// `fflate` provides a pure-javascript `.zip` archive reader, but its `DEFLATE`
// decompressor is also pure javascript and about twice as slow as Node.js's
// "native" `zlib` module (which is written in C). So this implementation uses
// `fflate` only to "scan" the input stream for individual file entries, and
// delegates the actual decompression to Node.js's `zlib` (see `NodeZlibInflate`
// below) to get native speed while keeping `fflate`'s streaming archive reader.

// This code was originally submitted by Stian Jensen.
// https://github.com/catamphetamine/read-excel-file/pull/122

// A `*.zip` file consists of individual file entries with the "total" summary section
// placed at the end of the file rather than at the start of it, which was originally done
// to allow for easy append of data to a given `.zip` file.
// https://en.wikipedia.org/wiki/ZIP_(file_format)
//
// But this also means that reading a `*.zip` file from a stream can't really be done
// using the "officially recommended" way of first reading the "total" summary section
// and only then reading the individual file entries specified in that summary section.
//
// So in order to be able to read a `*.zip` file from a stream, some corners have to be cut.
// For example, the "total" summary section is completely ignored and instead the reader
// should adopt "data recovery" software approach — it should proactively "scan" the input stream
// for individual file entries and handle them one-by-one as they come.
//
// Such approach doesn't seem to contradict with the XLSX specification
// because an `*.xlsx` files is supposed to be a normal `.zip` archive
// without any "trickery" such as "deleted" files or "garbage" data
// hiding under the hood.
//
// So when handling `*.xlsx` file, we assume that each such file must start
// with an individual file entry followed by another individual file entry, etc.
//
// When the "summary" section is reached, we assume that the archive has ended.
//
// To read a `.zip` archive, the code uses `fflate`'s `Unzip` class to "scan" the input
// stream for individual file entries. The actual decompression of the entries' data, which
// in `*.xlsx` files is compressed using the `DEFLATE` compression algorithm, is delegated
// to Node.js's built-in `zlib` module (see `NodeZlibInflate` below) rather than to `fflate`'s
// own pure-javascript `UnzipInflate` decompressor, because the native `zlib` bindings are
// about twice as fast.
//
// The `Unzip` class doesn't speak the Node.js stream interface, and `fflate`'s readme
// doesn't include a clear "reading a `.zip` file from a Node.js stream" section.
// https://github.com/101arrowz/fflate/issues/251
// Instead, the `Unzip` class has its own `push(chunk)` / `onfile` / `entry.ondata` protocol.
// This code reads the binary input stream and forwards each chunk of it to `unzip.push()`,
// and then collects the decompressed file entries.
//
import { Unzip } from 'fflate'

import { Buffer } from 'node:buffer'
import zlib from 'node:zlib'

// A `DEFLATE` (compression method `8`) decompressor for `fflate`'s `Unzip` class
// that's backed by Node.js's native `zlib` bindings (about twice as fast as
// `fflate`'s pure-javascript `UnzipInflate`).
//
// It implements `fflate`'s decoder interface: `Unzip` constructs one per entry,
// assigns its `ondata(error, chunk, isLast)` callback, and feeds it the entry's
// compressed bytes via `push(chunk, isLast)`. Unlike `fflate`'s synchronous
// `UnzipInflate`, `zlib` decompresses asynchronously, so an entry only finishes
// some ticks after its last chunk is pushed (see the `pending` bookkeeping below).
class NodeZlibInflate {
	static compression = 8

	constructor() {
		this.inflate = zlib.createInflateRaw()
		this.inflate.on('data', (chunk) => this.ondata(null, chunk, false))
		this.inflate.on('end', () => this.ondata(null, new Uint8Array(0), true))
		this.inflate.on('error', (error) => this.ondata(error, null, false))
	}

	push(chunk, isLast) {
		this.inflate.write(Buffer.from(chunk))
		if (isLast) {
			this.inflate.end()
		}
	}

	terminate() {
		this.inflate.destroy()
	}
}

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

		// The native `zlib` decoder finishes inflating an entry asynchronously, so
		// the archive's `end` event can fire while entries are still decompressing.
		// `pending` counts entries that have started but not yet finished, and the
		// promise only resolves once the stream has ended *and* every entry is done.
		let pending = 0
		let streamEnded = false
		const resolveIfDone = () => {
			if (!errored && streamEnded && pending === 0) {
				resolve(files)
			}
		}

		const { validateChunk } = createZipFileValidator((isValid) => {
			if (!isValid) {
				onError(new Error('Invalid `.zip` archive'))
			}
		})

		// `Unzip` discovers each individual file entry in the input data stream
		// and then calls the callback function for each such entry.
		const unzip = new Unzip((entry) => {
			// If there already was an error while reading this `.zip` file,
			// ignore any follow-up entries.
			if (errored) {
				return
			}

			// Skip directory entries (their names end with a slash).
			// Only files are of any interest.
			if (entry.name.endsWith('/')) {
				return
			}

			// See if this file should be ignored.
			// If it should, this entry won't be processed, i.e. `Unzip` will not try
			// to decompress its data, and will just discard it.
			if (filter && !filter({ path: entry.name })) {
				return
			}

			pending++

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
					pending--
					resolveIfDone()
				}
			}

			// Start decompressing this entry.
			entry.start()
		})

		// Register the decompressor for the data that was compressed using
		// `DEFLATE` compression algorithm (compression method `8`),
		// which is what `.xlsx` files use. The "stored" method (`0`, no compression)
		// is handled by `fflate` out of the box, so it doesn't need to be registered.
		unzip.register(NodeZlibInflate)

		stream
			// Catch errors emitted from the input stream (for example, a file read error).
			.on('error', onError)
			// When another chunk of data is read from the input stream.
			.on('data', (chunk) => {
				// If there already was an error while reading this `.zip` file,
				// ignore any follow-up data chunks.
				if (errored) {
					return
				}
				// Validate the `.zip` archive as its data comes through.
				validateChunk(chunk)
				// If the `.zip` archive is found to be invalid, stop any further
				// processing of it.
				if (errored) {
					return
				}
				// Push the next data chunk to `fflate`'s `Unzip` class instance.
				try {
					unzip.push(chunk, false)
				} catch (error) {
					onError(error)
				}
			})
			// When there's no more data in the input stream to consume,
			// finish reading the `.zip` archive.
			.on('end', () => {
				// If there were any errors when reading the `.zip` archive,
				// don't `resolve()` with anything.
				if (errored) {
					return
				}
				try {
					// Signal the end of the archive to `fflate`'s `Unzip` class instance.
					// It will flush any remaining state in it.
					unzip.push(new Uint8Array(0), true)
					streamEnded = true
					// Entries may still be inflating asynchronously; resolve once
					// they all finish (or immediately if there are none pending).
					resolveIfDone()
				} catch (error) {
					onError(error)
				}
			})
	})
}

// Every section in a `.zip` archive is marked with 4 bytes, the first two of which
// are `0x50` and `0x4B`, which reads "PK", referencing the initials of the inventor Phil Katz.
//
// It looks like `fflate`'s `Unzip` doesn't ever complain about whatever data is thrown at it.
// Due to how `.zip` file format is defined, "garbage" data could be placed at various
// places in it and it'd still be a valid `.zip` archive. It's likely that for this reason
// `fflate` doesn't ever complain and simply emits no entries when fed any kind of invalid data.
//
// In order to introduce some basic validation, here we specifically demand
// that a `.zip` archive must at least start with an individual file entry
// because an `.xlsx` file creator softwared really shouldn't attempt doing
// anything "funny" when writing a file, hence this adherence requirement.
//
function createZipFileValidator(onValidationResult) {
	const firstBytesCount = 2
	const firstBytes = []
	let firstBytesCheckResult
	return {
		validateChunk(chunk) {
			if (firstBytes.length < 2) {
				let i = 0
				while (i < chunk.length && i < firstBytesCount) {
					firstBytes.push(chunk[i])
					i++
				}
				if (firstBytes.length === 2) {
					const isValid = firstBytes[0] === 0x50 && firstBytes[1] === 0x4B
					onValidationResult(isValid)
				}
			}
		}
	}
}
