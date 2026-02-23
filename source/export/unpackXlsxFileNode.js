import unzipFromStream from '../zip/unzipFromStream.js'
import convertInputToNodeStream from './convertInputToNodeStream.js'
import convertValuesFromUint8ArraysToStrings from './convertValuesFromUint8ArraysToStrings.js'
import filterZipArchiveEntry from './filterZipArchiveEntry.js'

/**
 * Unpacks XLSX file contents, because it's just a `*.zip` archive.
 * @param  {(string|Stream|Buffer|Blob)} input - A Node.js readable stream or a `Buffer` or a `Blob` or a path to a file.
 * @return {Promise} Resolves to an object holding XLSX file entries.
 */
export default function unpackXlsxFile(input) {
  const stream = convertInputToNodeStream(input)
  return unzipFromStream(stream, { filter: filterZipArchiveEntry })
      .then(convertValuesFromUint8ArraysToStrings)
}