export default function dropEmptyRows(data, {
  rowIndexSourceMap,
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
      if (rowIndexSourceMap) {
        rowIndexSourceMap.splice(i, 1)
      }
    } else if (onlyTrimAtTheEnd) {
      break
    }
    i--
  }
  return data
}