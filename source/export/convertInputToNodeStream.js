import fs from 'fs'
import { Blob } from 'buffer'
import Stream, { Readable } from 'stream'

/**
 * Converts Node.js input argument to a stream.
 * @param  {(string|Stream|Buffer|Blob)} input - A Node.js readable stream or a `Buffer` or a `Blob` or a path to a file.
 * @returns {Stream}
 */
export default function convertInputToNodeStream(input) {
  return input instanceof Stream
    ? input
    : (
      input instanceof Buffer
        ? createReadableStreamFromBuffer(input)
        : (
          input instanceof Blob
            ? createReadableStreamFromBlob(input)
            : fs.createReadStream(input)
        )
    )
}

// Creates a readable stream from a `Buffer`.
function createReadableStreamFromBuffer(buffer) {
  // Node.js seems to have a bug in `Readable.from()` function:
  // it doesn't correctly handle empty buffers, i.e. it doesn't return a correct stream.
  // https://gitlab.com/catamphetamine/read-excel-file/-/issues/106
  if (buffer.length === 0) {
    throw new Error('No data')
  }
  return Readable.from(buffer)
}

// Creates a readable stream from a `Blob`.
function createReadableStreamFromBlob(blob) {
  // I didn't test but I'd presume that Node.js would throw on an empty `Blob`
  // same way it does on an empty `Buffer`.
  // https://gitlab.com/catamphetamine/read-excel-file/-/issues/106
  if (blob.size === 0) {
    throw new Error('No data')
  }
  // Convert a web `ReadableStream` to a Node.js `Readable` `Stream`.
  return Readable.fromWeb(blob.stream())
}