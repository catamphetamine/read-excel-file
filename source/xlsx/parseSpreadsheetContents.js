import parseSpreadsheetInfo from './parseSpreadsheetInfo.js'
import parseFilePaths from './parseFilePaths.js'
import parseStyles from './parseStyles.js'
import parseSharedStrings from './parseSharedStrings.js'
import parseSheet from './parseSheet.js'

// For an introduction in reading `.xlsx` files see "The minimum viable XLSX reader":
// https://www.brendanlong.com/the-minimum-viable-xlsx-reader.html

/**
 * Reads data from an `.xlsx` file.
 * @param  {Record<string,string>} contents - A map of `.xml` files inside the `.xlsx` file (which itself is just a zipped directory).
 * @param  {object} xml — An object having a single property — `createDocument(string)` function.
 * @param  {object} [options]
 * @return {ReadFileResult}
 */
export default function parseSpreadsheetContents(contents, xml, options = {}) {
  const getFileContent = (filePath) => {
    if (!contents[filePath]) {
      throw new Error(`"${filePath}" file not found inside the *.xlsx file zip archive`)
    }
    return contents[filePath]
  }

  // Read the paths to certain files inside the `.xlsx` file, which is itself just a `.zip` archive.
  // These paths aren't standardized between different spreadsheet editors.
  // https://github.com/tidyverse/readxl/issues/104
  const filePaths = parseFilePaths(getFileContent('xl/_rels/workbook.xml.rels'), xml)

  // The usual file path for "shared strings" is "xl/sharedStrings.xml".
  const sharedStrings = filePaths.sharedStrings
    ? parseSharedStrings(getFileContent(filePaths.sharedStrings), xml)
    : []

  // The usual file path for "styles" is "xl/styles.xml".
  const styles = filePaths.styles
    ? parseStyles(getFileContent(filePaths.styles), xml)
    : {}

  const { sheets, epoch1904 } = parseSpreadsheetInfo(getFileContent('xl/workbook.xml'), xml)

  const sheetIdsToRead = options.sheets && options.sheets.map(sheet => getSheetId(sheet, sheets))

  // Parse sheets data.

  const sheetsData = []

  for (const sheetId of Object.keys(filePaths.sheets)) {
    if (sheetIdsToRead && !sheetIdsToRead.includes(sheetId)) {
      continue
    }

    sheetsData.push({
      sheet: getSheetNameById(sheetId, sheets),
      data: parseSheet(
        getFileContent(filePaths.sheets[sheetId]),
        xml,
        sharedStrings,
        styles,
        epoch1904,
        options
      )
    })
  }

  // Return spreadsheet data.
  return sheetsData
}

function getSheetId(sheet, sheets) {
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

function getSheetNameById(sheetId, sheets) {
  for (const sheet of sheets) {
    if (sheet.relationId === sheetId) {
      return sheet.name
    }
  }
  throw new Error(`Sheet ID not found: ${sheetId}`)
}