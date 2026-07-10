import parseSpreadsheetInfo from './parseSpreadsheetInfo.js'
import parseFilePaths from './parseFilePaths.js'
import parseStyles from './parseStyles.js'
import parseSharedStrings from './parseSharedStrings.js'
import parseSheet from './parseSheet.js'
import parseNumberDefault from './parseNumber.js'

import checkpoint, { latestCheckpointTimestamp } from '../utility/checkpoint.js'
import isPromise from '../utility/isPromise.js'

// For an introduction in reading `.xlsx` files see "The minimum viable XLSX reader":
// https://www.brendanlong.com/the-minimum-viable-xlsx-reader.html

/**
 * Reads data from an `.xlsx` file.
 * @param  {function} parseXmlStream — SAX XML parser.
 * @param  {Record<string,string>} contents - A map of `.xml` files inside the `.xlsx` file (which itself is just a zipped directory).
 * @param  {object} [options]
 * @return {Promise<Sheet[]>}
 */
function parseSpreadsheetContents(parseXmlStream, contents, options = {}) {
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
    parseXmlStream
  ).then(({ spreadsheetInfo, filePaths }) => {
    checkpoint('parse "shared strings" and "styles"')

    // Parse "shared strings" and "styles".
    return readFiles(
      getXmlFilesAtNonFixedPaths(filePaths),
      contents,
      parseXmlStream
    ).then(({ sharedStrings, styles }) => {
      const sheetRelationIdsToRead = options.sheets
        ? options.sheets.map(sheet => getSheetRelationId(sheet, spreadsheetInfo.sheets))
        : spreadsheetInfo.sheets.map(_ => _.relationId)

      checkpoint(`parse sheet${sheetRelationIdsToRead.length === 1 ? '' : 's'} data`)

      // Parse sheets data.
      return readFiles(
        getSheetDataXmlFiles(filePaths, sheetRelationIdsToRead, {
          sharedStrings,
          styles,
          epoch1904: spreadsheetInfo.epoch1904,
          options
        }),
        contents,
        parseXmlStream
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
 * @param  {function} [createWorkerFunction] — Creates a worker function.
 * @param  {function} parseXmlStream — SAX XML parser.
 * @param  {Record<string,string>} contents - A map of `.xml` files inside the `.xlsx` file (which itself is just a zipped directory).
 * @param  {object} [options]
 * @return {Promise<Sheet[]>}
 */
export default function parseSpreadsheetContentsInWorker(createWorkerFunction, parseXmlStream, contents, options) {
  // Assign the default `parseNumber()` function in the `options`.
  // The reason is that the worker code requires it to be non-`undefined`.
  // Otherwise, it would throw "parseNumber is not defined".
  if (!(options && options.parseNumber)) {
    options = {
      ...options,
      parseNumber: parseNumberDefault
    }
  }

  // Using a worker requires specifying all the top-level variables or functions that it uses.
  // Currently, that list looks a little bit too long so for now workers aren't used for parsing sheet data.
  // See the comment in `createWorkerFunction()` call for more details.
  // createWorkerFunction = undefined

  // If the environment doesn't support "workers", parse spreadsheet contents "synchronously".
  // This will "block" the main thread while parsing.
  if (!createWorkerFunction) {
    return parseSpreadsheetContents(parseXmlStream, contents, options)
  }

  // Any functions have to be removed from the `options` in order for them to be "serializable"
  // before sending them to the worker thread.
  const { parseNumber, ...optionsJson } = options

  // Create a worker.
  const workerFn = createWorkerFunction(
    (data) => {
      // Reconstruct the `options`.
      const options = {
        ...data.optionsJson,
        parseNumber
      }
      // Parse sheet data from the `.xml` files.
      return parseSpreadsheetContents(parseXmlStream, data.contents, options)
    }
  )

  workerFn.addDependencies(
    // Any "outside" dependencies that're referenced in the function (below).
    () => [
      parseXmlStream,
      parseNumber,
      parseSpreadsheetContents,
      getSheetRelationId,
      getSheetNameByRelationId,
      getXmlFilesAtFixedPaths,
      getXmlFilesAtNonFixedPaths,
      getSheetDataXmlFiles,
      readFiles,
      checkpoint,
      latestCheckpointTimestamp,
      isPromise,
      // parseSheet,
      //
      // This is not the full list by any means. There's more. Quite a lot more of them.
      // It started looking a bit too much so I stopped adding the dependencies here.
      // Now I understand why `fflate`'s source code is all written in a single
      // multi-thousand-line `index.ts` file. The thing is, once one starts splitting
      // the code into modules, they'd have to manually export any top-level variables
      // or functions from those modules and import them here in order to specify them
      // in the list of dependencies. And even if doing so for every top-level variable
      // or function in every imported module doesn't seem like an impossible task,
      // imagine someone refactoring the code later and extracting new top-level
      // variables or functions. Without 100% code coverage requirement, it won't be caught
      // at build time and can only be caught in production, which isn't ideal to say the least.
      // So it seems like users of this package will have to just deal with the "blocking"
      // nature of the sheet data parser, because I won't follow into `fflate`'s steps
      // and rewrite this package as a single `index.js` file.
      // Users of this package will have to manually put their code in a worker
      // in case they'd prefer it to run in a separate thread to prevent "blocking"
      // the main thread when parsing sheet data.
    ]
  )

  // Post a message with some data to the worker
  // so that it starts processing the data
  // and later posts a message back to the main thread
  // with the result of the calculation.
  return workerFn.callOnce({ optionsJson, contents }) // (optional) add `transferList` argument.
}

function getSheetRelationId(sheet, sheets) {
  if (typeof sheet === 'string') {
    for (const _sheet of sheets) {
      if (_sheet.name === sheet) {
        return _sheet.relationId
      }
    }
		throw new Error(`Sheet "${sheet}" not found. Available sheets: ${sheets.map(({ name }) => `"${name}"`).join(', ')}`)
  } else {
		if (sheet <= sheets.length) {
      return sheets[sheet - 1].relationId
    }
    throw new Error(`Sheet number out of bounds: ${sheet}. Available sheets count: ${sheets.length}`)
  }
}

function getSheetNameByRelationId(sheetRelationId, sheets) {
  for (const sheet of sheets) {
    if (sheet.relationId === sheetRelationId) {
      return sheet.name
    }
  }
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
      fallback: []
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
        parse: (content, parseXmlStream) => parseSheet(content, parseXmlStream, sheetDataParserParameters)
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
function readFiles(filesInfo, contents, parseXmlStream) {
  // Get files' contents.
  const results = {}
  for (const filePath of Object.keys(filesInfo)) {
    const fileInfo = filesInfo[filePath]
    results[fileInfo.name] = contents[filePath] === undefined
      ? (
        fileInfo.fallback === undefined
          ? (() => { throw new Error(`"${filePath}" file not found inside the \`.xlsx\` file`) })()
          : fileInfo.fallback
      )
      : fileInfo.parse(contents[filePath], parseXmlStream)
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