const namespaces = {
  a: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
}

const letters = ["", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"]

/**
 * Reads an (unzipped) XLSX file structure into a 2D array of cells.
 * @param  {object} contents - A list of XML files inside XLSX file (which is a zipped directory).
 * @return {string[][]} An array of rows, each row being an array of cells.
 */
export default function readXlsx(contents, xml, options = {}) {
  const { rowMap } = options

  let sheet
  let values

  if (!contents[`xl/worksheets/sheet${options.sheet}.xml`]) {
    throw new Error(`Sheet "${options.sheet}" not found in *.xlsx file.`)
  }

  try {
    sheet = parseSheet(contents[`xl/worksheets/sheet${options.sheet}.xml`], xml)
    values = parseValues(contents[`xl/sharedStrings.xml`], xml)
  }
  catch (error) {
    // Guards against malformed XLSX files.
    console.error(error)
    return []
  }

  const { cells, coordinates } = sheet

  const cols = coordinates[1].column - coordinates[0].column + 1
  const rows = coordinates[1].row - coordinates[0].row + 1

  const data = []

  times(rows, () => {
    const row = []
    times(cols, () => row.push(null))
    data.push(row)
  })

  for (const cell of cells) {
    let value = cell.value

    if (cell.type === 's') {
      value = values[parseInt(value)]
    }

    // Convert empty values to `null`.
    // `value` could still be `null` or `undefined`.
    value = value && value.trim() || null

    if (data[cell.row - coordinates[0].row]) {
      data[cell.row - coordinates[0].row][cell.column - coordinates[0].column] = value
    }
  }

  if (data.length === 0) {
    return []
  }

  return dropEmptyRows(dropEmptyColumns(data), rowMap)
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

function Cell(cellNode, sheet, xml) {
  const coords = CellCoords(cellNode.getAttribute('r'))
  const value = xml.select(sheet, cellNode, 'a:v', namespaces)[0]
  return {
    column : coords.column,
    row    : coords.row,
    // For `xpath` `value` can be `undefined` while for native `DOMParser` it's `null`.
    value  : value && value.textContent,
    type   : cellNode.getAttribute('t')
  }
}

export function dropEmptyRows(data, rowMap) {
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
      if (cell) {
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

function dropEmptyColumns(data) {
  let i = data[0].length - 1
  while (i >= 0) {
    let empty = true
    for (const row of data) {
      if (row[i]) {
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

function parseSheet(content, xml) {
  const sheet = xml.createDocument(content)

  const cells = xml.select(sheet, null, '/a:worksheet/a:sheetData/a:row/a:c', namespaces).map(node => Cell(node, sheet, xml))

  let coordinates = xml.select(sheet, null, '//a:dimension/@ref', namespaces)[0]
  if (coordinates) {
    coordinates = coordinates.textContent.split(':').map(CellCoords)
  } else {
    coordinates = calculateDimensions(cells)
  }

  return { cells, coordinates }
}

function parseValues(content, xml) {
  const strings = xml.createDocument(content)
  return xml.select(strings, null, '//a:si', namespaces)
    .map(string => xml.select(strings, string, './/a:t[not(ancestor::a:rPh)]', namespaces).map(_ => _.textContent).join(''))
}