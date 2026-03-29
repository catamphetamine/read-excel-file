export default function reconstructSheetDimensionsFromSheetCells(cells) {
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
