import fs from 'fs'
import Stream from 'stream'
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

  const stream = input instanceof Stream ? input : fs.createReadStream(input)

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
          entry
            .on('data', data => contents += data.toString())
            .on('end', () => resolve(entries[entry.path] = contents))
        }))
      })
  })
}
