import fs from 'node:fs'
import { Blob } from 'node:buffer'
import { types } from 'node:util'
import Stream, { Readable } from 'node:stream'

import InvalidInputError from '../xlsx/file/InvalidInputError.js'

/**
 * Converts Node.js input argument to a stream.
 * @param  {(string|Stream|Buffer|Blob)} input - A Node.js readable stream or a `Buffer` or a `Blob` or a path to a file.
 * @returns {Stream}
 */
export default function convertInputToNodeStream(input) {
  return input instanceof Stream
    ? input
    : (
      types.isArrayBuffer(input)
        ? Readable.from(Buffer(input))
        : (
          ArrayBuffer.isView(input)
            ? Readable.from([input])
            : (
              input instanceof Buffer
                ? Readable.from(input)
                : (
                  input instanceof Blob
                    ? Readable.fromWeb(input.stream())
                    : (
                      typeof input === 'string'
                        ? fs.createReadStream(input)
                        : (() => { throw new InvalidInputError('INPUT_TYPE_NOT_SUPPORTED') })()
                    )
                )
            )
        )
    )
}