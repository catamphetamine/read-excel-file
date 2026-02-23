import dropEmptyRows from './dropEmptyRows.js'
import dropEmptyColumns from './dropEmptyColumns.js'

export default function getData(sheet, options) {
  const { dimensions, cells } = sheet

  // If the sheet is empty.
  if (cells.length === 0) {
    return []
  }

  const [leftTop, rightBottom] = dimensions

  // Don't discard empty rows or columns at the start of the spreadsheet,
  // even when the `*.xlsx` file itself tells that the content starts at an offset.
  // https://github.com/catamphetamine/read-excel-file/issues/102
  // const colsCount = (rightBottom.column - leftTop.column) + 1
  // const rowsCount = (rightBottom.row - leftTop.row) + 1

  const colsCount = rightBottom.column
  const rowsCount = rightBottom.row

  // Initialize spreadsheet data structure.
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

  // Fill in spreadsheet `data`.
  // (this code implies that `cells` aren't necessarily sorted by row and column:
  //  maybe that's not correct, this piece code was initially copy-pasted
  //  from some other library that used `XPath`)
  for (const cell of cells) {
    // Don't discard empty rows or columns at the start of the spreadsheet,
    // even when the `*.xlsx` file itself tells that the content starts at an offset.
    // https://github.com/catamphetamine/read-excel-file/issues/102
    // const rowIndex = cell.row - leftTop.row
    // const columnIndex = cell.column - leftTop.column
    const rowIndex = cell.row - 1
    const columnIndex = cell.column - 1
    // Ignore the data in the cell if it's outside of the spreadsheet's "dimensions".
    if (columnIndex < colsCount && rowIndex < rowsCount) {
      data[rowIndex][columnIndex] = cell.value
    }
  }

  // Fill in the row map.
  const { rowIndexSourceMap } = options
  if (rowIndexSourceMap) {
    let i = 0
    while (i < data.length) {
      rowIndexSourceMap[i] = i
      i++
    }
  }

  // Drop (discard) empty columns or rows.
  //
  // Don't discard empty rows or columns at the start or in the middle.
  // Only discard empty rows at the bottom or empty columns on the right side.
  // The rationale is that the data should be output in the same shape or form
  // as it can be seen in the actual spreadsheet.
  // If the user decides to discard empty rows or columns, they could do it manually
  // by passing `transformData()` function as an option.
  //
  data = dropEmptyRows(
    dropEmptyColumns(data, { onlyTrimAtTheEnd: true }),
    { onlyTrimAtTheEnd: true, rowIndexSourceMap }
  )

  // Optionally transform data before applying `schema`.
  if (options.transformData) {
    data = options.transformData(data)
    // data = options.transformData(data, {
    //   dropEmptyRowsAndColumns(data) {
    //     return dropEmptyRows(dropEmptyColumns(data), { rowIndexSourceMap })
    //   }
    // })
  }

  return data
}