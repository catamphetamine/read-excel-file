// Maps "A1"-like coordinates to `{ row, column }` numeric coordinates.
const LETTERS = ["", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"]

export function calculateDimensions (cells) {
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

// Converts a letter coordinate to a digit coordinate.
// Examples: "A" -> 1, "B" -> 2, "Z" -> 26, "AA" -> 27, etc.
function columnLettersToNumber(columnLetters) {
  // `for ... of ...` would require Babel polyfill for iterating a string.
  let n = 0
  let i = 0
  while (i < columnLetters.length) {
    n *= 26
    n += LETTERS.indexOf(columnLetters[i])
    i++
  }
  return n
}

export function parseCellCoordinates(coords) {
  // Coordinate examples: "AA2091", "R988", "B1".
  coords = coords.split(/(\d+)/)
  return [
    // Row.
    parseInt(coords[1]),
    // Column.
    columnLettersToNumber(coords[0].trim())
  ]
}