import parseSpreadsheetInfo from './parseSpreadsheetInfo.js'
import parseFilePaths from './parseFilePaths.js'
import parseStyles from './parseStyles.js'
import parseSharedStrings from './parseSharedStrings.js'
import parseSheet from './parseSheet.js'

import checkpoint from '../utility/checkpoint.js'

import isPromise from '../utility/isPromise.js'

// For an introduction in reading `.xlsx` files see "The minimum viable XLSX reader":
// https://www.brendanlong.com/the-minimum-viable-xlsx-reader.html

/**
 * Reads data from an `.xlsx` file.
 * @param  {Record<string,string>} contents - A map of `.xml` files inside the `.xlsx` file (which itself is just a zipped directory).
 * @param  {function} parseXmlTree — Parses an XML string into a DOM tree.
 * @param  {function} [parseXmlStream] — (optional) "streaming" XML parser. Using "streaming" also requires Node.js because it uses Node.js streams.
 * @param  {object} [options]
 * @return {Promise<Sheet[]>}
 */
export default function parseSpreadsheetContents(contents, parseXmlTree, parseXmlStream, options = {}) {
  // Because of how `.xlsx` file contents are defined in the specification,
  // it will have to be read in 3 passes:
  // * First pass — read the actual file paths
  // * Second pass — read "shared strings" and "styles"
  // * Thirs pass — read the sheets data

  checkpoint('parse spreadsheet info and file paths')

  // Get spreadsheet info and the paths to files.
  const { spreadsheetInfo, filePaths } = readFiles(
    FILES_INFO_AT_FIXED_PATHS,
    contents,
    parseXmlTree,
    parseXmlStream
  )

  checkpoint('parse "shared strings" and "styles"')

  // Parse "shared strings" and "styles".
  return readFiles(
    getFilesInfoAtNonFixedPaths(filePaths),
    contents,
    parseXmlTree,
    parseXmlStream
  ).then(({ sharedStrings, styles }) => {
    checkpoint('parse sheets data')

    const sheetRelationIdsToRead = options.sheets
      ? options.sheets.map(sheet => getSheetRelationId(sheet, spreadsheetInfo.sheets))
      : spreadsheetInfo.sheets.map(_ => _.relationId)

    // Parse sheets data.
    return readFiles(
      getSheetFilesInfoAtNonFixedPaths(filePaths, sheetRelationIdsToRead, {
        sharedStrings,
        styles,
        epoch1904: spreadsheetInfo.epoch1904,
        options
      }),
      contents,
      parseXmlTree,
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

const FILES_INFO_AT_FIXED_PATHS = {
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

function getFilesInfoAtNonFixedPaths(filePaths) {
  return {
    // The usual file path for "shared strings" is "xl/sharedStrings.xml".
    [filePaths.sharedStrings || 'xl/sharedStrings.xml']: {
      name: 'sharedStrings',
      // `parseSharedStrings()` returns a `Promise`.
      parse: parseSharedStrings,
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

function getSheetFilesInfoAtNonFixedPaths(filePaths, sheetRelationIdsToRead, sheetDataParserParameters) {
  return Object.keys(filePaths.sheets)
    .filter((sheetRelationId) => sheetRelationIdsToRead.includes(sheetRelationId))
    .reduce((filesInfo, sheetRelationId) => ({
      ...filesInfo,
      [filePaths.sheets[sheetRelationId]]: {
        name: sheetRelationId,
        // `parseSheet()` returns a `Promise`.
        parse: (content, parseXmlTree, parseXmlStream) => parseSheet(content, parseXmlTree, parseXmlStream, sheetDataParserParameters)
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
function readFiles(filesInfo, contents, parseXmlTree, parseXmlStream) {
  // Get files' contents.
  const results = {}
  for (const filePath of Object.keys(filesInfo)) {
    const fileInfo = filesInfo[filePath]
    results[fileInfo.name] = contents[filePath] === undefined
      ? (
        fileInfo.fallback === undefined
          ? throwFileNotFoundError(filePath)
          : fileInfo.fallback
      )
      : fileInfo.parse(contents[filePath], parseXmlTree, parseXmlStream)
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

function throwFileNotFoundError(filePath) {
  throw new Error(`"${filePath}" file not found inside the \`.xlsx\` file`)
}