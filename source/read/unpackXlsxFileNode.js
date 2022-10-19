import fs from 'fs'
import Stream, { Readable } from 'stream'
import unzip from 'unzipper'

/**
 * Reads XLSX file in Node.js.
 * @param  {(string|Stream)} input - A Node.js readable stream or a path to a file.
 * @return {Promise} Resolves to an object holding XLSX file entries.
 */
export default function unpackXlsxFile(input) {
  // XLSX file is a zip archive.
  // The `entries` object stores the files
  // and their contents from this XLSX zip archive.
  const entries = {}

  const stream = input instanceof Stream
    ? input
    : (
      input instanceof Buffer
        ? Readable.from(input)
        : fs.createReadStream(input)
    )

  return new Promise((resolve, reject) => {
    const entryPromises = []

    stream
      // This first "error" listener is for the original stream errors.
      .on('error', reject)
      .pipe(unzip.Parse())
      // This second "error" listener is for the unzip stream errors.
      .on('error', reject)
      .on('close', () =>  Promise.all(entryPromises).then(() => resolve(entries)))
      .on('entry', (entry) => {
        let contents = ''
        // To ignore an entry: `entry.autodrain()`.
        entryPromises.push(new Promise((resolve) => {
          // It's not clear what encoding are the files inside XLSX in.
          // https://stackoverflow.com/questions/45194771/are-xlsx-files-utf-8-encoded-by-definition
          // For example, for XML files, encoding is specified at the top node:
          // `<?xml version="1.0" encoding="UTF-8"/>`.
          //
          // `unzipper` supports setting encoding when reading an `entry`.
          // https://github.com/ZJONSSON/node-unzipper/issues/35
          // https://gitlab.com/catamphetamine/read-excel-file/-/issues/54
          //
          // If the `entry.setEncoding('utf8')` line would be commented out,
          // there's a `nonAsciiCharacterEncoding` test that wouldn't pass.
          //
          entry.setEncoding('utf8')
          //
          entry
            .on('data', data => contents += data.toString())
            .on('end', () => resolve(entries[entry.path] = contents))
        }))
      })
  })
}
