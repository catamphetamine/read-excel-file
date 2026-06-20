import parseCell, {
  readChildElements,
  createInitialState as createInitialStateInsideCell,
  onOpenTag as onOpenTagInsideCell,
  onCloseTag as onCloseTagInsideCell,
  onText as onTextInsideCell
} from './parseCell.js'

export default function parseCells(state, sharedStrings, styles, epoch1904, options) {
  return state.cells.map(({ attributes, value, inlineStringValue }) => {
    return parseCell(
      attributes,
      value,
      inlineStringValue,
      sharedStrings,
      styles,
      epoch1904,
      options
    )
  })
}

export function createInitialState() {
  return {
    c: false,
    attributes: undefined,
    stateForCell: undefined,
    cells: []
  }
}

export function onOpenTag(tagName, attributes, state) {
  if (tagName === 'c') {
    state.c = true
    state.attributes = attributes
    state.stateForCell = createInitialStateInsideCell()
  } else if (state.c) {
    onOpenTagInsideCell(tagName, attributes, state.stateForCell)
  }
}

export function onCloseTag(tagName, state) {
  if (tagName === 'c') {
    state.cells.push({
      attributes: state.attributes,
      value: state.stateForCell.value,
      inlineStringValue: state.stateForCell.inlineStringValue
    })
    state.c = false
    state.attributes = undefined
    state.stateForCell = undefined
  } else if (state.c) {
    onCloseTagInsideCell(tagName, state.stateForCell)
  }
}

export function onText(text, state) {
  if (state.c) {
    onTextInsideCell(text, state.stateForCell)
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