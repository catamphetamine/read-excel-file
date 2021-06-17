import parseDate from './parseDate'

import {
  getSharedStrings,
  getCellValue,
  getCells,
  getDimensions,
  getBaseStyles,
  getCellStyles,
  getNumberFormats,
  getWorkbookProperties,
  getRelationships,
  getSheets
} from '../xml/xlsx'

// Maps "A1"-like coordinates to `{ row, column }` numeric coordinates.
const letters = ["", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"]

// https://hexdocs.pm/xlsxir/number_styles.html
const BUILT_IN_DATE_NUMBER_FORMAT_IDS = [14,15,16,17,18,19,20,21,22,27,30,36,45,46,47,50,57]

/**
 * Reads an (unzipped) XLSX file structure into a 2D array of cells.
 * @param  {object} contents - A list of XML files inside XLSX file (which is a zipped directory).
 * @param  {number?} options.sheet - Workbook sheet id (`1` by default).
 * @param  {string?} options.dateFormat - Date format, e.g. "MM/DD/YY". Values having this format template set will be parsed as dates.
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

  // Some Excel editors don't want to use standard naming scheme for sheet files.
  // https://github.com/tidyverse/readxl/issues/104
  const fileNames = parseFileNames(contents['xl/_rels/workbook.xml.rels'], xml)
  // Default file path for "shared strings": "xl/sharedStrings.xml".
  const values = parseValues(contents[`xl/${fileNames.sharedStrings}`], xml)
  // Default file path for "styles": "xl/styles.xml".
  const styles = parseStyles(contents[`xl/${fileNames.styles}`], xml)
  const properties = parseProperties(contents['xl/workbook.xml'], xml)

  // A feature for getting the list of sheets in an Excel file.
  // https://github.com/catamphetamine/read-excel-file/issues/14
  if (options.getSheets) {
    return properties.sheets.map(({ name }) => ({
      name
    }))
  }

  // Find the sheet by name, or take the first one.
  let sheetRelationId
  if (typeof options.sheet === 'number') {
    const _sheet = properties.sheets[options.sheet - 1]
    sheetRelationId = _sheet && _sheet.relationId
  } else {
    for (const sheet of properties.sheets) {
      if (sheet.name === options.sheet) {
        sheetRelationId = sheet.relationId
        break
      }
    }
  }

  // If the sheet wasn't found then throw an error.
  // Example: "xl/worksheets/sheet1.xml".
  if (!sheetRelationId || !fileNames.sheets[sheetRelationId]) {
    throw createSheetNotFoundError(options.sheet, properties.sheets)
  }

  // Parse sheet data.
  const sheet = parseSheet(
    contents[`xl/${fileNames.sheets[sheetRelationId]}`],
    xml,
    values,
    styles,
    properties,
    options
  )

  // If the sheet is empty.
  if (sheet.cells.length === 0) {
    if (options.properties) {
      return {
        data: [],
        properties
      }
    }
    return []
  }

  const [ leftTop, rightBottom ] = sheet.dimensions

  const colsCount = (rightBottom.column - leftTop.column) + 1
  const rowsCount = (rightBottom.row - leftTop.row) + 1

  // `sheet.cells` seem to not necessarily be sorted by row and column.
  let data = new Array(rowsCount)
  let i = 0
  while (i < rowsCount) {
    data[i] = new Array(colsCount)
    let j = 0
    while (j < colsCount) {
      data[i][j] = null
      j++
    }
    i++
  }

  for (const cell of sheet.cells) {
    const row = cell.row - leftTop.row
    const column = cell.column - leftTop.column
    data[row][column] = cell.value
  }

  // Fill in the row map.
  const { rowMap } = options
  if (rowMap) {
    let i = 0
    while (i < data.length) {
      rowMap[i] = i
      i++
    }
  }

  data = dropEmptyRows(
    dropEmptyColumns(data, { onlyTrimAtTheEnd: true }),
    { onlyTrimAtTheEnd: true, rowMap }
  )

  if (options.transformData) {
    data = options.transformData(data)
    // data = options.transformData(data, {
    //   dropEmptyRowsAndColumns(data) {
    //     return dropEmptyRows(dropEmptyColumns(data), { rowMap })
    //   }
    // })
  }

  if (options.properties) {
    return {
      data,
      properties
    }
  }

  return data
}

function calculateDimensions (cells) {
  const comparator = (a, b) => a - b
  const allRows = cells.map(cell => cell.row).sort(comparator)
  const allCols = cells.map(cell => cell.column).sort(comparator)
  const minRow = allRows[0]
  const maxRow = allRows[allRows.length - 1]
  const minCol = allCols[0]
  const maxCol = allCols[allCols.length - 1]

  return [
    { row: minRow, column: minCol },
    { row: maxRow, column: maxCol }
  ]
}

function colToInt(col) {
  // `for ... of ...` would require Babel polyfill for iterating a string.
  let n = 0
  let i = 0
  while (i < col.length) {
    n *= 26
    n += letters.indexOf(col[i])
    i++
  }
  return n
}

function CellCoords(coords) {
  // Examples: "AA2091", "R988", "B1"
  coords = coords.split(/(\d+)/)
  return [
    // Row.
    parseInt(coords[1]),
    // Column.
    colToInt(coords[0].trim())
  ]
}

// Example of a `<c/>`ell element:
//
// <c>
//    <f>string</f> — formula.
//    <v>string</v> — formula pre-computed value.
//    <is>
//       <t>string</t> — an `inlineStr` string (rather than a "common string" from a dictionary).
//       <r>
//          <rPr>
//            ...
//          </rPr>
//          <t>string</t>
//       </r>
//       <rPh sb="1" eb="1">
//          <t>string</t>
//       </rPh>
//       <phoneticPr fontId="1"/>
//    </is>
//    <extLst>
//       <ext>
//          <!--any element-->
//       </ext>
//    </extLst>
// </c>
//
function Cell(cellNode, sheet, xml, values, styles, properties, options) {
  const coords = CellCoords(cellNode.getAttribute('r'))

  const valueElement = getCellValue(sheet, cellNode)

  // For `xpath`, `value` can be `undefined` while for native `DOMParser` it's `null`.
  // So using `value && ...` instead of `if (value !== undefined) { ... }` here
  // for uniform compatibility with both `xpath` and native `DOMParser`.
  let value = valueElement && valueElement.textContent

  let type
  if (cellNode.hasAttribute('t')) {
    type = cellNode.getAttribute('t')
  } else {
    // Default cell type is "n" (numeric).
    // http://www.datypic.com/sc/ooxml/t-ssml_CT_Cell.html
    type = 'n'
  }

  // Available Excel cell types:
  // https://github.com/SheetJS/sheetjs/blob/19620da30be2a7d7b9801938a0b9b1fd3c4c4b00/docbits/52_datatype.md
  //
  // Some other document (seems to be old):
  // http://webapp.docx4java.org/OnlineDemo/ecma376/SpreadsheetML/ST_CellType.html
  //
  switch (type) {
    // If the cell contains formula string.
    case 'str':
      value = value.trim()
      if (value === '') {
        value = undefined
      }
      break

    // If the cell contains an "inline" (not "shared") string.
    case 'inlineStr':
      if (cellNode.firstChild &&
        cellNode.firstChild.tagName === 'is' &&
        cellNode.firstChild.firstChild &&
        cellNode.firstChild.firstChild.tagName === 't') {
        value = cellNode.firstChild.firstChild.textContent
      } else {
        throw new Error(`Unsupported "inline string" cell value structure: ${cellNode.textContent}`)
      }
      break

    // If the cell contains a "shared" string.
    // "Shared" strings is a way for an Excel editor to reduce
    // the file size by storing "commonly used" strings in a dictionary
    // and then referring to such strings by their index in that dictionary.
    case 's':
      // If a cell has no value then there's no `<c/>` element for it.
      // If a `<c/>` element exists then it's not empty.
      // The `<v/>`alue is a key in the "shared strings" dictionary of the
      // XLSX file, so look it up in the `values` dictionary by the numeric key.
      value = values[parseInt(value)].trim()
      if (value === '') {
        value = undefined
      }
      break

    case 'b':
      value = value === '1' ? true : false
      break

    // Stub: blank stub cell that is ignored by data processing utilities.
    case 'z':
      value = undefined
      break

    // Error: `value` is a numeric code.
    // They also wrote: "and `w` property stores its common name".
    // It's unclear what they meant by that.
    case 'e':
      value = decodeError(value)
      break

    // Date: a string to be parsed as a date.
    // (usually a string in "ISO 8601" format)
    case 'd':
      if (value === undefined) {
        break
      }
      value = new Date(value)
      break

    case 'n':
      if (value === undefined) {
        break
      }
      value = parseFloat(value)
      // XLSX does have "d" type for dates, but it's not commonly used.
      //  specific format for dates.
      // Sometimes a date can be heuristically detected.
      // https://github.com/catamphetamine/read-excel-file/issues/3#issuecomment-395770777
      //
      // Format IDs:
      // https://xlsxwriter.readthedocs.io/format.html#format-set-num-format
      //
      if (cellNode.hasAttribute('s')) {
        const styleId = parseInt(cellNode.getAttribute('s'))
        const style = styles[styleId]
        if (!style) {
          throw new Error(`Cell style not found: ${styleId}`)
        }
        if (BUILT_IN_DATE_NUMBER_FORMAT_IDS.indexOf(parseInt(style.numberFormat.id)) >= 0 ||
          (options.dateFormat && style.numberFormat.template === options.dateFormat) ||
          (options.smartDateParser !== false && style.numberFormat.template && isDateTemplate(style.numberFormat.template))) {
          value = parseDate(value, properties)
        }
      }
      break

    default:
      throw new TypeError(`Cell type not supported: ${type}`)
  }

  // Convert empty values to `null`.
  if (value === undefined) {
    value = null
  }

  return {
    row: coords[0],
    column: coords[1],
    value
  }
}

export function dropEmptyRows(data, {
  rowMap,
  accessor = _ => _,
  onlyTrimAtTheEnd
} = {}) {
  // Drop empty rows.
  let i = data.length - 1
  while (i >= 0) {
    // Check if the row is empty.
    let empty = true
    for (const cell of data[i]) {
      if (accessor(cell) !== null) {
        empty = false
        break
      }
    }
    // Remove the empty row.
    if (empty) {
      data.splice(i, 1)
      if (rowMap) {
        rowMap.splice(i, 1)
      }
    } else if (onlyTrimAtTheEnd) {
      break
    }
    i--
  }
  return data
}

export function dropEmptyColumns(data, {
  accessor = _ => _,
  onlyTrimAtTheEnd
} = {}) {
  let i = data[0].length - 1
  while (i >= 0) {
    let empty = true
    for (const row of data) {
      if (accessor(row[i]) !== null) {
        empty = false
        break
      }
    }
    if (empty) {
      let j = 0;
      while (j < data.length) {
        data[j].splice(i, 1)
        j++
      }
    } else if (onlyTrimAtTheEnd) {
      break
    }
    i--
  }
  return data
}

function parseSheet(content, xml, values, styles, properties, options) {
  const sheet = xml.createDocument(content)

  let cells = getCells(sheet)

  if (cells.length === 0) {
    return { cells: [] }
  }

  cells = cells.map((node) => {
    return Cell(node, sheet, xml, values, styles, properties, options)
  })

  let dimensions = getDimensions(sheet)
  if (dimensions) {
    dimensions = dimensions.split(':').map(CellCoords).map(([row, column]) => ({
      row,
      column
    }))
    // When there's only a single cell on a sheet
    // there can sometimes be just "A1" for the dimensions string.
    if (dimensions.length === 1) {
      dimensions = [dimensions[0], dimensions[0]]
    }
  } else {
    dimensions = calculateDimensions(cells)
  }

  return { cells, dimensions }
}

function parseValues(content, xml) {
  if (!content) {
    return []
  }
  return getSharedStrings(xml.createDocument(content))
}

// http://officeopenxml.com/SSstyles.php
// Returns an array of cell styles.
// A cell style index is its ID.
function parseStyles(content, xml) {
  if (!content) {
    return {}
  }

  // https://social.msdn.microsoft.com/Forums/sqlserver/en-US/708978af-b598-45c4-a598-d3518a5a09f0/howwhen-is-cellstylexfs-vs-cellxfs-applied-to-a-cell?forum=os_binaryfile
  // https://www.office-forums.com/threads/cellxfs-cellstylexfs.2163519/
  const doc = xml.createDocument(content)

  const baseStyles = getBaseStyles(doc)
    .map(parseCellStyle)

  const numberFormats = getNumberFormats(doc)
    .map(parseNumberFormatStyle)
    .reduce((formats, format) => {
      // Format ID is a numeric index.
      // There're some standard "built-in" formats (in Excel) up to about `100`.
      formats[format.id] = format
      return formats
    }, [])

  const getCellStyle = (xf) => {
    if (xf.hasAttribute('xfId')) {
      return {
        ...baseStyles[xf.xfId],
        ...parseCellStyle(xf, numberFormats)
      }
    }
    return parseCellStyle(xf, numberFormats)
  }

  return getCellStyles(doc).map(getCellStyle)
}

function parseNumberFormatStyle(numFmt) {
  return {
    id: numFmt.getAttribute('numFmtId'),
    template: numFmt.getAttribute('formatCode')
  }
}

// http://www.datypic.com/sc/ooxml/e-ssml_xf-2.html
function parseCellStyle(xf, numFmts) {
  const style = {}
  if (xf.hasAttribute('numFmtId')) {
    const numberFormatId = xf.getAttribute('numFmtId')
    // Built-in number formats don't have a `<numFmt/>` element in `styles.xml`.
    // https://hexdocs.pm/xlsxir/number_styles.html
    if (numFmts[numberFormatId]) {
      style.numberFormat = numFmts[numberFormatId]
    } else {
      style.numberFormat = { id: numberFormatId }
    }
  }
  return style
}

// I guess `xl/workbook.xml` file should always be present inside the *.xlsx archive.
function parseProperties(content, xml) {
  const book = xml.createDocument(content)

  const properties = {};

  // Read `<workbookPr/>` element to detect whether dates are 1900-based or 1904-based.
  // https://support.microsoft.com/en-gb/help/214330/differences-between-the-1900-and-the-1904-date-system-in-excel
  // http://webapp.docx4java.org/OnlineDemo/ecma376/SpreadsheetML/workbookPr.html

  const workbookProperties = getWorkbookProperties(book)

  if (workbookProperties && workbookProperties.getAttribute('date1904') === '1') {
    properties.epoch1904 = true
  }

  // Get sheets info (indexes, names, if they're available).
  // Example:
  // <sheets>
  //   <sheet
  //     xmlns:ns="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  //     name="Sheet1"
  //     sheetId="1"
  //     ns:id="rId3"/>
  // </sheets>
  // http://www.datypic.com/sc/ooxml/e-ssml_sheet-1.html

  properties.sheets = []

  const addSheetInfo = (sheet) => {
    if (sheet.getAttribute('name')) {
      properties.sheets.push({
        id: sheet.getAttribute('sheetId'),
        name: sheet.getAttribute('name'),
        relationId: sheet.getAttribute('r:id')
      })
    }
  }

  getSheets(book).forEach(addSheetInfo)

  return properties;
}

/**
 * Returns sheet file paths.
 * Seems that the correct place to look for the
 * `sheetId` -> `filename` mapping seems to be in the
 * `xl/_rels/workbook.xml.rels` file.
 * https://github.com/tidyverse/readxl/issues/104
 * @param  {string} content — `xl/_rels/workbook.xml.rels` file contents.
 * @param  {object} xml
 * @return {object}
 */
function parseFileNames(content, xml) {
  // Example:
  // <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  //   ...
  //   <Relationship
  //     Id="rId3"
  //     Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet"
  //     Target="worksheets/sheet1.xml"/>
  // </Relationships>
  const document = xml.createDocument(content)

  const fileNames = {
    sheets: {},
    sharedStrings: undefined,
    styles: undefined
  }

  const addFileNamesInfo = (relationship) => {
    const filePath = relationship.getAttribute('Target')
    switch (relationship.getAttribute('Type')) {
      case 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles':
        fileNames.styles = filePath
        break
      case 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings':
        fileNames.sharedStrings = filePath
        break
      case 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet':
        fileNames.sheets[relationship.getAttribute('Id')] = filePath
        break
    }
  }

  getRelationships(document).forEach(addFileNamesInfo)

  if (!fileNames.styles) {
    throw new Error('"styles.xml" file not found in the *.xlsx file')
  }

  // Seems like "sharedStrings.xml" is not required to exist.
  // For example, when the spreadsheet doesn't contain any strings.
  // https://github.com/catamphetamine/read-excel-file/issues/85
  // if (!fileNames.sharedStrings) {
  //   throw new Error('"sharedStrings.xml" file not found in the *.xlsx file')
  // }

  return fileNames
}

function isDateTemplate(template) {
  const tokens = template.split(/\W+/)
  for (const token of tokens) {
    if (['MM', 'DD', 'YY', 'YYYY'].indexOf(token) < 0) {
      return false
    }
  }
  return true
}

function createSheetNotFoundError(sheet, sheets) {
  const sheetsList = sheets && sheets.map((sheet, i) => `"${sheet.name}" (#${i + 1})`).join(', ')
  return new Error(`Sheet ${typeof sheet === 'number' ? '#' + sheet : '"' + sheet + '"'} not found in the *.xlsx file.${sheets ? ' Available sheets: ' + sheetsList + '.' : ''}`)
}

// Decodes numeric error code to a string code.
// https://github.com/SheetJS/sheetjs/blob/19620da30be2a7d7b9801938a0b9b1fd3c4c4b00/docbits/52_datatype.md
function decodeError(errorCode) {
  // While the error values are determined by the application,
  // the following are some example error values that could be used:
  switch (errorCode) {
    case 0x00:
      return '#NULL!'
    case 0x07:
      return '#DIV/0!'
    case 0x0F:
      return '#VALUE!'
    case 0x17:
      return '#REF!'
    case 0x1D:
      return '#NAME?'
    case 0x24:
      return '#NUM!'
    case 0x2A:
      return '#N/A'
    case 0x2B:
      return '#GETTING_DATA'
    default:
      // Such error code doesn't exist. I made it up.
      return `#ERROR_${errorCode}`
  }
}