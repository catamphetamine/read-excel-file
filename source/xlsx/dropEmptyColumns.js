export default function dropEmptyColumns(data, {
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