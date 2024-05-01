import parseProperties from './parseProperties.js'
import parseFilePaths from './parseFilePaths.js'
import parseStyles from './parseStyles.js'
import parseSharedStrings from './parseSharedStrings.js'
import parseSheet from './parseSheet.js'
import getData from './getData.js'

// For an introduction in reading `*.xlsx` files see "The minimum viable XLSX reader":
// https://www.brendanlong.com/the-minimum-viable-xlsx-reader.html

/**
 * Reads an (unzipped) XLSX file structure into a 2D array of cells.
 * @param  {object} contents - A list of XML files inside XLSX file (which is a zipped directory).
 * @param  {number?} options.sheet - Workbook sheet id (`1` by default).
 * @param  {string?} options.dateFormat - Date format, e.g. "mm/dd/yyyy". Values having this format template set will be parsed as dates.
 * @param  {object} contents - A list of XML files inside XLSX file (which is a zipped directory).
 * @return {object} An object of shape `{ data, cells, properties }`. `data: string[][]` is an array of rows, each row being an array of cell values. `cells: string[][]` is an array of rows, each row being an array of cells. `properties: object` is the spreadsheet properties (e.g. whether date epoch is 1904 instead of 1900).
 */
export default function readXlsx(contents, xml, options = {}) {
  if (!options.sheet) {
    options = {
      sheet: 1,
      ...options
    }
  }

  const getXmlFileContent = (filePath) => {
    if (!contents[filePath]) {
      throw new Error(`"${filePath}" file not found inside the *.xlsx file zip archive`)
    }
    return contents[filePath]
  }

  // Some Excel editors don't want to use standard naming scheme for sheet files.
  // https://github.com/tidyverse/readxl/issues/104
  const filePaths = parseFilePaths(getXmlFileContent('xl/_rels/workbook.xml.rels'), xml)

  // Default file path for "shared strings": "xl/sharedStrings.xml".
  const values = filePaths.sharedStrings
    ? parseSharedStrings(getXmlFileContent(filePaths.sharedStrings), xml)
    : []

  // Default file path for "styles": "xl/styles.xml".
  const styles = filePaths.styles
    ? parseStyles(getXmlFileContent(filePaths.styles), xml)
    : {}

  const properties = parseProperties(getXmlFileContent('xl/workbook.xml'), xml)

  // A feature for getting the list of sheets in an Excel file.
  // https://github.com/catamphetamine/read-excel-file/issues/14
  if (options.getSheets) {
    return properties.sheets.map(({ name }) => ({
      name
    }))
  }

  // Find the sheet by name, or take the first one.
  const sheetId = getSheetId(options.sheet, properties.sheets)

  // If the sheet wasn't found then throw an error.
  // Example: "xl/worksheets/sheet1.xml".
  if (!sheetId || !filePaths.sheets[sheetId]) {
    throw createSheetNotFoundError(options.sheet, properties.sheets)
  }

  // Parse sheet data.
  const sheet = parseSheet(
    getXmlFileContent(filePaths.sheets[sheetId]),
    xml,
    values,
    styles,
    properties,
    options
  )

  options = {
    // Create a `rowIndexMap` for the original dataset, if not passed,
    // because "empty" rows will be dropped from the input data.
    rowMap: [],
    ...options
  }

  // Get spreadsheet data.
  const data = getData(sheet, options)

  // Can return properties, if required.
  if (options.properties) {
    return {
      data,
      properties
    }
  }

  // Return spreadsheet data.
  return data
}

function getSheetId(sheet, sheets) {
  if (typeof sheet === 'number') {
    const _sheet = sheets[sheet - 1]
    return _sheet && _sheet.relationId
  }
  for (const _sheet of sheets) {
    if (_sheet.name === sheet) {
      return _sheet.relationId
    }
  }
}

function createSheetNotFoundError(sheet, sheets) {
  const sheetsList = sheets && sheets.map((sheet, i) => `"${sheet.name}" (#${i + 1})`).join(', ')
  return new Error(`Sheet ${typeof sheet === 'number' ? '#' + sheet : '"' + sheet + '"'} not found in the *.xlsx file.${sheets ? ' Available sheets: ' + sheetsList + '.' : ''}`)
}