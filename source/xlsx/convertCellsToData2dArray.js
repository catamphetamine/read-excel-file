import dropEmptyRows from './dropEmptyRows.js'
import dropEmptyColumns from './dropEmptyColumns.js'

export default function convertCellsToData2dArray(cells, dimensions) {
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

  // // Fill in the row map, if the row map was passed.
  // if (options.rowIndexSourceMap) {
  //   let i = 0
  //   while (i < data.length) {
  //     options.rowIndexSourceMap[i] = i
  //     i++
  //   }
  // }

  // Drop (discard) empty columns at the right side.
  // Drop (discard) empty rows at the bottom.
  data = dropEmptyRows(
    dropEmptyColumns(data, { onlyTrimAtTheEnd: true }),
    { onlyTrimAtTheEnd: true } // { onlyTrimAtTheEnd: true, rowIndexSourceMap: options.rowIndexSourceMap }
  )

  return data
}