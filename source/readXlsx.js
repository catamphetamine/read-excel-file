const namespaces = {
  a: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
}

const letters = ["", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"]

/**
 * Reads an (unzipped) XLSX file structure into a 2D array of cells.
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

  const { rowMap } = options

  let sheet
  let properties

  if (!contents[`xl/worksheets/sheet${options.sheet}.xml`]) {
    throw new Error(`Sheet "${options.sheet}" not found in *.xlsx file.`)
  }

  try {
    const values = parseValues(contents[`xl/sharedStrings.xml`], xml)
    properties = parseProperties(contents[`xl/workbook.xml`], xml)
    sheet = parseSheet(contents[`xl/worksheets/sheet${options.sheet}.xml`], xml, values)
  }
  catch (error) {
    // Guards against malformed XLSX files.
    console.error(error)
    if (options.schema) {
      return {
        data: [],
        properties: {}
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

  // cells = dropEmptyRows(dropEmptyColumns(cells, _ => _.value), rowMap, _ => _.value)

  let data = cells.map(row => row.map(cell => cell.value))
  data = dropEmptyRows(dropEmptyColumns(data), rowMap)

  if (options.schema) {
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

function Cell(cellNode, sheet, xml, values) {
  const coords = CellCoords(cellNode.getAttribute('r'))

  let value = xml.select(sheet, cellNode, 'a:v', namespaces)[0]
  // For `xpath` `value` can be `undefined` while for native `DOMParser` it's `null`.
  value = value && value.textContent

  if (cellNode.getAttribute('t') === 's') {
    value = values[parseInt(value)]
  }

  // Convert empty values to `null`.
  // `value` could still be `null` or `undefined`.
  value = value && value.trim() || null

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
      if (accessor(cell)) {
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

function dropEmptyColumns(data, accessor = _ => _) {
  let i = data[0].length - 1
  while (i >= 0) {
    let empty = true
    for (const row of data) {
      if (accessor(row[i])) {
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

function parseSheet(content, xml, values, styles) {
  const sheet = xml.createDocument(content)

  const cells = xml.select(sheet, null, '/a:worksheet/a:sheetData/a:row/a:c', namespaces).map(node => Cell(node, sheet, xml, values, styles))

  let dimensions = xml.select(sheet, null, '//a:dimension/@ref', namespaces)[0]
  if (dimensions) {
    dimensions = dimensions.textContent.split(':').map(CellCoords)
  } else {
    dimensions = calculateDimensions(cells)
  }

  return { cells, dimensions }
}

function parseValues(content, xml) {
  const strings = xml.createDocument(content)
  return xml.select(strings, null, '//a:si', namespaces)
    .map(string => xml.select(strings, string, './/a:t[not(ancestor::a:rPh)]', namespaces).map(_ => _.textContent).join(''))
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
  return properties;
}