import unzipFromStream from '../zip/unzipFromStream.js'
import convertInputToNodeStream from './convertInputToNodeStream.js'
import convertValuesFromUint8ArraysToStrings from './convertValuesFromUint8ArraysToStrings.js'
import filterZipArchiveEntry from './filterZipArchiveEntry.js'

/**
 * Unpacks `*.xlsx` file contents.
 * An `.xlsx` file is really just a `.zip` archive with `.xml` files inside.
 * @param  {(string|Stream|Buffer|Blob)} input
 * @return {Promise<Record<string,string>} Resolves to an object holding `*.xlsx` file entries.
 */
export default function unpackXlsxFile(input) {
  const stream = convertInputToNodeStream(input)
  return unzipFromStream(stream, { filter: filterZipArchiveEntry })
      .then(convertValuesFromUint8ArraysToStrings)
}