import parseCell, {
  createInitialStateInCell,
  onOpenTagInCell,
  onCloseTagInCell,
  onTextInCell
} from './parseCell.js'

export default function parseSheetData(state, sharedStrings, styles, epoch1904, options) {
  return state.cells.map(({ attributes, value, inlineString }) => {
    return parseCell(
      attributes,
      value,
      inlineString,
      sharedStrings,
      styles,
      epoch1904,
      options
    )
  })
}

export function createInitialStateInSheetData() {
  return {
    c: undefined,
    cells: []
  }
}

export function onOpenTagInSheetData(tagName, attributes, state) {
  if (tagName === 'c') {
    state.c = createInitialStateInCell()
    state.c.attributes = attributes
  } else if (state.c) {
    onOpenTagInCell(tagName, attributes, state.c)
  }
}

export function onCloseTagInSheetData(tagName, state) {
  if (tagName === 'c') {
    state.cells.push({
      attributes: state.c.attributes,
      value: state.c.value,
      inlineString: state.c.inlineString
    })
    state.c = undefined
  } else if (state.c) {
    onCloseTagInCell(tagName, state.c)
  }
}

export function onTextInSheetData(text, state) {
  if (state.c) {
    onTextInCell(text, state.c)
  }
}

// Here, it could also parse "merged cells" and then return them in some special way.
// But then it's not clear what should be the way to return such merged cells.
// I.e. should it just return it as a duplicate value in each one of the merged cells?
// Or should it keep the current behavior of only returning the value of the top-most left-most cell
// and then just return `null` for the rest of the cells in a "merged cells" group?
// Perhaps the latter (current) approach is the most sensible one, so there's no need
// to change anything.
//
// const mergedCells = getMergedCellCoordinates(sheetDocument)
// for (const mergedCell of mergedCells) {
//   const [from, to] = mergedCell.split(':').map(parseCellAddress)
//   console.log('Merged Cell.', 'From:', from, 'To:', to)
// }