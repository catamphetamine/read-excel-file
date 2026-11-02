import parseSpreadsheetInfo from './parseSpreadsheetInfo.js'
import parseFilePaths from './parseFilePaths.js'
import parseStyles from './parseStyles.js'
import parseSharedStrings from './parseSharedStrings.js'
import parseSheet from './parseSheet.js'

import convertValuesFromUint8ArraysToStrings from '../utility/convertValuesFromUint8ArraysToStrings.js'
import checkpoint from '../utility/checkpoint.js'
import isPromise from '../utility/isPromise.js'

import InvalidSpreadsheetError from './InvalidSpreadsheetError.js'
import SheetNotFoundError from './SheetNotFoundError.js'

/**
 * Reads data from an `.xlsx` file.
 * @param  {function} parseXml — SAX XML parser.
 * @param  {Record<string,Uint8Array>} contents - A map of `.xml` files inside the `.xlsx` file (which itself is just a zipped directory).
 * @param  {object} [options]
 * @return {Promise<Sheet[]>}
 */
function parseSpreadsheetContents(parseXml, contents_, options = {}) {
  // For an introduction in reading `.xlsx` files see "The minimum viable XLSX reader":
  // https://www.brendanlong.com/the-minimum-viable-xlsx-reader.html

  // Convert the values in `contents_` from `Uint8Array`s to `string`s.
  //
  // This function is a bit of a bottleneck on large `.xlsx` files.
  // For example, when running the benchmark, the time of calling this function is:
  //
  // * "1mb.xlsx" — 2
  // * "10mb.xlsx" — 7
  // * "50mb.xlsx" — 35
  //
  // When running this code in a worker, it's no longer a "bottleneck"
  // because in that case it doesn't block the main thread.
  //
  const contents = convertValuesFromUint8ArraysToStrings(contents_)

  // Because of how `.xlsx` file contents are defined in the specification,
  // it will have to be read in 3 passes:
  // * First pass — read the actual file paths
  // * Second pass — read "shared strings" and "styles"
  // * Thirs pass — read the sheets data

  checkpoint('parse spreadsheet info and file paths')

  // Get spreadsheet info and the paths to files.
  return readFiles(
    getXmlFilesAtFixedPaths(),
    contents,
    parseXml
  ).then(({ spreadsheetInfo, filePaths }) => {
    checkpoint('parse "shared strings" and "styles"')

    // Parse "shared strings" and "styles".
    return readFiles(
      getXmlFilesAtNonFixedPaths(filePaths),
      contents,
      parseXml
    ).then(({ sharedStrings, styles }) => {
      const sheetRelationIdsToRead = options.sheets
        ? options.sheets.map(sheet => getSheetRelationId(sheet, spreadsheetInfo.sheets))
        : spreadsheetInfo.sheets.map(_ => _.relationId)

      checkpoint(`parse sheet${sheetRelationIdsToRead.length === 1 ? '' : 's'} data`)

      const dateFormatDetectionCache = []

      // Parse sheets data.
      return readFiles(
        getSheetDataXmlFiles(filePaths, sheetRelationIdsToRead, {
          sharedStrings,
          styles,
          epoch1904: spreadsheetInfo.epoch1904,
          dateFormatDetectionCache,
          options
        }),
        contents,
        parseXml
      ).then((sheetsData) => {
        checkpoint('end')
        // Return sheets data.
        return sheetRelationIdsToRead.map((sheetRelationId) => ({
          sheet: getSheetNameByRelationId(sheetRelationId, spreadsheetInfo.sheets),
          data: sheetsData[sheetRelationId]
        }))
      })
    })
  })
}

/**
 * Reads data from an `.xlsx` file in a worker.
 * @param  {function} [createWorkerFunction] — Creates a worker function. Not used.
 * @param  {function} parseXml — SAX XML parser.
 * @param  {Record<string,Uint8Array>} contents - A map of `.xml` files inside the `.xlsx` file (which itself is just a zipped directory).
 * @param  {object} [options]
 * @return {Promise<Sheet[]>}
 */
export default function parseSpreadsheetContentsInWorker(createWorkerFunction, parseXml, contents, options) {
  // Assign a default value of `null` to `parseNumber()` function in the `options`.
  // The reason is that the worker code requires it to be non-`undefined`.
  // Otherwise, it would throw "parseNumber is not defined".
  if (!(options && options.parseNumber)) {
    options = {
      ...options,
      parseNumber: null
    }
  }

  return parseSpreadsheetContents(parseXml, contents, options)
}

function getSheetRelationId(sheet, sheets) {
  if (typeof sheet === 'string') {
    for (const _sheet of sheets) {
      if (_sheet.name === sheet) {
        return _sheet.relationId
      }
    }
  } else {
		if (sheet <= sheets.length) {
      return sheets[sheet - 1].relationId
    }
  }
  throw new SheetNotFoundError(sheet, sheets.map(_ => _.name))
}

function getSheetNameByRelationId(sheetRelationId, sheets) {
  for (const sheet of sheets) {
    if (sheet.relationId === sheetRelationId) {
      return sheet.name
    }
  }
  // The only way of getting `sheetRelationId` here is from the `sheets`,
  // so this error is not technically possible. And if it is thrown
  // then it means that there's a bug in the code because it's not
  // supposed to get `sheetRelationId` from anywhere other than the `sheets`.
  throw new Error(`Sheet relation ID not found: ${sheetRelationId}`)
}

function getXmlFilesAtFixedPaths() {
  return {
    // Read the paths to certain files inside the `.xlsx` file, which is itself just a `.zip` archive.
    // These paths aren't standardized between different spreadsheet editors.
    // https://github.com/tidyverse/readxl/issues/104
    'xl/_rels/workbook.xml.rels': {
      name: 'filePaths',
      parse: parseFilePaths
    },

    // General info on the spreadsheet.
    'xl/workbook.xml': {
      name: 'spreadsheetInfo',
      parse: parseSpreadsheetInfo
    }
  }
}

function getXmlFilesAtNonFixedPaths(filePaths) {
  return {
    // The usual file path for "shared strings" is "xl/sharedStrings.xml".
    [filePaths.sharedStrings || 'xl/sharedStrings.xml']: {
      name: 'sharedStrings',
      // `parseSharedStrings()` returns a `Promise`.
      parse: parseSharedStrings,
      // It seems that "sharedStrings.xml" is not required to exist.
      // For example, that could be the case when a spreadsheet doesn't contain any strings.
      // https://github.com/catamphetamine/read-excel-file/issues/85
      fallback: Promise.resolve([])
    },

    // The usual file path for "styles" is "xl/styles.xml".
    [filePaths.styles || 'xl/styles.xml']: {
      name: 'styles',
      parse: parseStyles,
      fallback: {}
    }
  }
}

// Returns the list of sheet data `.xml` files.
function getSheetDataXmlFiles(filePaths, sheetRelationIdsToRead, sheetDataParserParameters) {
  return Object.keys(filePaths.sheets)
    .filter((sheetRelationId) => sheetRelationIdsToRead.includes(sheetRelationId))
    .reduce((filesInfo, sheetRelationId) => ({
      ...filesInfo,
      [filePaths.sheets[sheetRelationId]]: {
        name: sheetRelationId,
        // `parseSheet()` returns a `Promise`.
        parse: (content, parseXml) => parseSheet(content, parseXml, sheetDataParserParameters)
      }
    }), {})
}

// In case of converting `.zip` file reader from a "read-and-return" one to a "streaming" one,
// this function could be modified to process the files as they come rather than all-at-once.

// Reads files from inside an `.xlsx` archive by file paths.
//
// In case of converting `.zip` file reader from a "read-and-return" one to a "streaming" one,
// this function could be modified to process the files as they come rather than all-at-once.
//
// But there's a catch: inside an `.xlsx` file, some file paths are not fixed
// and are instead defined in "xl/_rels/workbook.xml.rels" file,
// which presents a "chicken and an egg" dilemma: how could one possibly
// read an `.xlsx` file in one go when the order of the files inside it isn't fixed
// and could be random. Most likely, in the majority of cases, "xl/_rels/workbook.xml.rels"
// file is gonna be one of the first in a given `.xlsx` archive, but still it's not guaranteed.
// A solution would be reading an `.xlsx` file in two passes: one pass would be just to read
// the "xl/_rels/workbook.xml.rels" and ignore decompressing anything else,
// and then the second pass would be to read all other files whose paths are now known.
//
// Returns:
// * If none of the `parse()` functions returned a `Promise`, it returns a map of files' contents.
// * If any of the `parse()` functions returned a `Promise`, it returns a `Promise` that resolves to a map of files' contents.
//
function readFiles(filesInfo, contents, parseXml) {
  // Get files' contents.
  const results = {}
  for (const filePath of Object.keys(filesInfo)) {
    const fileInfo = filesInfo[filePath]
    results[fileInfo.name] = contents[filePath] === undefined
      ? (
        fileInfo.fallback === undefined
          ? (() => { throw new InvalidSpreadsheetError(`"${filePath}" file not found inside the \`.xlsx\` file`) })()
          : fileInfo.fallback
      )
      : fileInfo.parse(contents[filePath], parseXml)
  }
  // Resolve any `Promise`s.
  const promises = []
  for (const name of Object.keys(results)) {
    if (isPromise(results[name])) {
      promises.push(results[name].then((result) => {
        results[name] = result
      }))
    }
  }
  if (promises.length > 0) {
    return Promise.all(promises).then(() => results)
  }
  return results
}