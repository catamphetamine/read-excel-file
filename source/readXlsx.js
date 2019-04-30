import parseDate from './parseDate'

const namespaces = {
  a: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
}

// Maps "A1"-like coordinates to `{ row, column }` numeric coordinates.
const letters = ["", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"]

/**
 * Reads an (unzipped) XLSX file structure into a 2D array of cells.
 * @param  {object} contents - A list of XML files inside XLSX file (which is a zipped directory).
 * @param  {number?} options.sheet - Workbook sheet id (`1` by default).
 * @param  {string?} options.dateFormat - Date format, e.g. "MM/DD/YY". Values having this format template set will be parsed as dates.
 * @param  {object} contents - A list of XML files inside XLSX file (which is a zipped directory).
 * @return {object} An object of shape `{ data, cells, properties }`. `data: string[][]` is an array of rows, each row being an array of cell values. `cells: string[][]` is an array of rows, each row being an array of cells. `properties: object` is the spreadsheet properties (e.g. whether date epoch is 1904 instead of 1900).
 */
export default function readXlsx(contents, xml, options = {}) {
  // Deprecated 1.0.0 `sheet` argument. Will be removed in some next major release.
  if (typeof options === 'string' || typeof options === 'number') {
    options = { sheet: options }
  } else if (!options.sheet) {
    options = { ...options, sheet: 1 }
  }

  const values = parseValues(contents[`xl/sharedStrings.xml`], xml)
  const styles = parseStyles(contents[`xl/styles.xml`], xml)
  const properties = parseProperties(contents[`xl/workbook.xml`], xml)

  // A feature for getting the list of sheets in an Excel file.
  // https://github.com/catamphetamine/read-excel-file/issues/14
  if (options.getSheets) {
    return properties.sheets.map(({ name }) => ({
      name
    }))
  }

  // Find the sheet ID by index or name.
  let sheetId
  if (typeof options.sheet === 'number') {
    const _sheet = properties.sheets[options.sheet - 1]
    sheetId = _sheet && _sheet.id
  } else {
    for (const sheet of properties.sheets) {
      if (sheet.name === options.sheet) {
        sheetId = sheet.id
        break
      }
    }
  }

  // If the sheet wasn't found then throw an error.
  if (!sheetId || !contents[`xl/worksheets/sheet${sheetId}.xml`]) {
    throw createSheetNotFoundError(options.sheet, properties.sheets)
  }

  // Parse sheet data.
  const sheet = parseSheet(
    contents[`xl/worksheets/sheet${sheetId}.xml`],
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

  const cols = (rightBottom.column - leftTop.column) + 1
  const rows = (rightBottom.row - leftTop.row) + 1

  let cells = []

  times(rows, () => {
    const row = []
    times(cols, () => row.push({ value: null }))
    cells.push(row)
  })

  for (const cell of sheet.cells) {
    const row = cell.row - leftTop.row
    const column = cell.column - leftTop.column
    if (cells[row]) {
      cells[row][column] = cell
    }
  }

  let data = cells.map(row => row.map(cell => cell.value))
  data = dropEmptyRows(dropEmptyColumns(data), options.rowMap)

  // cells = dropEmptyRows(dropEmptyColumns(cells, _ => _.value), options.rowMap, _ => _.value)

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

function times(n, action) {
  let i = 0
  while (i < n) {
    action()
    i++
  }
}

function colToInt(col) {
  col = col.trim().split('')

  let n = 0;

  for (let i = 0; i < col.length; i++) {
    n *= 26
    n += letters.indexOf(col[i])
  }

  return n
}

function CellCoords(coords) {
  coords = coords.split(/(\d+)/)
  return {
    row    : parseInt(coords[1]),
    column : colToInt(coords[0])
  }
}

function Cell(cellNode, sheet, xml, values, styles, properties, options) {
  const coords = CellCoords(cellNode.getAttribute('r'))

  let value = xml.select(sheet, cellNode, 'a:v', namespaces)[0]
  // For `xpath` `value` can be `undefined` while for native `DOMParser` it's `null`.
  value = value && value.textContent

  // http://webapp.docx4java.org/OnlineDemo/ecma376/SpreadsheetML/ST_CellType.html
  switch (cellNode.getAttribute('t')) {
    case 's':
      value = values[parseInt(value)].trim()
      if (value === '') {
        value = undefined
      }
      break

    case 'b':
      value = value === '1' ? true : false
      break

    case 'n':
    // Default type is "n".
    // http://www.datypic.com/sc/ooxml/t-ssml_CT_Cell.html
    default:
      if (value === undefined) {
        break
      }
      value = parseFloat(value)
      // XLSX has no specific format for dates.
      // Sometimes a date can be heuristically detected.
      // https://github.com/catamphetamine/read-excel-file/issues/3#issuecomment-395770777
      const style = styles[parseInt(cellNode.getAttribute('s') || 0)]
      if ((style.numberFormat.id >= 14 && style.numberFormat.id <= 22) ||
        (style.numberFormat.id >= 45 && style.numberFormat.id <= 47) ||
        (options.dateFormat && style.numberFormat.template === options.dateFormat) ||
        (options.smartDateParser !== false && style.numberFormat.template && isDateTemplate(style.numberFormat.template))) {
        value = parseDate(value, properties)
      }
      break
  }

  // Convert empty values to `null`.
  if (value === undefined) {
    value = null
  }

  return {
    row    : coords.row,
    column : coords.column,
    value
  }
}

export function dropEmptyRows(data, rowMap, accessor = _ => _) {
  // Fill in row map.
  if (rowMap) {
    let j = 0
    while (j < data.length) {
      rowMap[j] = j
      j++
    }
  }
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
    }
    i--
  }
  return data
}

export function dropEmptyColumns(data, accessor = _ => _) {
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
    }
    i--
  }
  return data
}

function parseSheet(content, xml, values, styles, properties, options) {
  const sheet = xml.createDocument(content)

  const cells = xml.select(sheet, null, '/a:worksheet/a:sheetData/a:row/a:c', namespaces).map(node => Cell(node, sheet, xml, values, styles, properties, options))

  if (cells.length === 0) {
    return { cells }
  }

  let dimensions = xml.select(sheet, null, '//a:dimension/@ref', namespaces)[0]

  if (dimensions) {
    dimensions = dimensions.textContent.split(':').map(CellCoords)
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
  const strings = xml.createDocument(content)
  return xml.select(strings, null, '//a:si', namespaces)
    .map(string => xml.select(strings, string, './/a:t[not(ancestor::a:rPh)]', namespaces).map(_ => _.textContent).join(''))
}

// http://officeopenxml.com/SSstyles.php
function parseStyles(content, xml) {
  if (!content) {
    return {}
  }
  // https://social.msdn.microsoft.com/Forums/sqlserver/en-US/708978af-b598-45c4-a598-d3518a5a09f0/howwhen-is-cellstylexfs-vs-cellxfs-applied-to-a-cell?forum=os_binaryfile
  // https://www.office-forums.com/threads/cellxfs-cellstylexfs.2163519/
  const doc = xml.createDocument(content)
  const baseStyles = xml.select(doc, null, '//a:styleSheet/a:cellStyleXfs/a:xf', namespaces).map(parseCellStyle);
  const numFmts = xml.select(doc, null, '//a:styleSheet/a:numFmts/a:numFmt', namespaces)
    .map(parseNumberFormatStyle)
    .reduce((formats, format) => {
      formats[format.id] = format
      return formats
    }, [])

  return xml.select(doc, null, '//a:styleSheet/a:cellXfs/a:xf', namespaces).map((xf) => {
    if (xf.hasAttribute('xfId')) {
      return {
        ...baseStyles[xf.xfId],
        ...parseCellStyle(xf, numFmts)
      }
    }
    return parseCellStyle(xf, numFmts)
  })
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
    if (numFmts[numberFormatId]) {
      style.numberFormat = numFmts[numberFormatId]
    } else {
      style.numberFormat = { id: numberFormatId }
    }
  }
  return style
}

function parseProperties(content, xml) {
  if (!content) {
    return {}
  }
  const book = xml.createDocument(content)
  // http://webapp.docx4java.org/OnlineDemo/ecma376/SpreadsheetML/workbookPr.html
  const workbookProperties = xml.select(book, null, '//a:workbookPr', namespaces)[0]
  if (!workbookProperties) {
    return {}
  }
  const properties = {};
  // https://support.microsoft.com/en-gb/help/214330/differences-between-the-1900-and-the-1904-date-system-in-excel
  if (workbookProperties.getAttribute('date1904') === '1') {
    properties.epoch1904 = true
  }
  // Get sheets info (indexes, names, if they're available).
  properties.sheets = []
  let i = 0
  for (const sheet of xml.select(book, null, '//a:sheets/a:sheet', namespaces)) {
    if (sheet.getAttribute('name')) {
      properties.sheets.push({
        id: sheet.getAttribute('sheetId'),
        name: sheet.getAttribute('name')
      })
    }
    i++
  }
  return properties;
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
  return new Error(`Sheet ${typeof sheet === 'number' ? '#' + sheet : '"' + sheet + '"'} not found in *.xlsx file.${sheets ? ' Available sheets: ' + sheetsList + '.' : ''}`)
}