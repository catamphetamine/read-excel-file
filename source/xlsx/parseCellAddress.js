/**
 * Parses XLSX cell address into a row number and a column number.
 * @param {string} coordinatesString
 * @returns {number[]} Returns `[rowNumber, columnNumber]`
 */
export default function parseCellAddress(coordinatesString) {
  // Coordinate examples: "AA2091", "R988", "B1".
  const [column, row] = coordinatesString.split(/(\d+)/)
  return [
    // Row number (starting at `1`).
    Number(row),
    // Column number (starting at `1`).
		// It's not clear if the `column` part could ever be non-trimmed,
		// but this `.trim()` call was already here when I copied this code from somewhere.
    getColumnNumberFromColumnLetters(column.trim())
  ]
}

// Maps "A1"-like coordinates to `{ row, column }` numeric coordinates.
const LETTERS = ["", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"]

// Converts a letter coordinate to a digit coordinate.
// Examples: "A" -> 1, "B" -> 2, "Z" -> 26, "AA" -> 27, etc.
function getColumnNumberFromColumnLetters(columnLetters) {
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
