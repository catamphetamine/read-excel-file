import parseCellAddress from './parseCellAddress.js'

/**
 * Reads sheet `dimensions`, which defines the spreadsheet area containing all non-empty cells.
 * https://docs.microsoft.com/en-us/dotnet/api/documentformat.openxml.spreadsheet.sheetdimension?view=openxml-2.8.1
 * @param {object} state
 * @returns {object[]} `undefined` or `[{ row, column }, { row, column }]` — "From row number and column number to row number and column number".
 */
export default function parseSheetDimensions(state) {
  if (state.ref) {
    let dimensions = state.ref.split(':').map(parseCellAddress).map(([row, column]) => ({
      row,
      column
    }))
    // Sometimes there can be just a single cell as a spreadsheet's "dimensions".
    // For example, the default "dimensions" in Apache POI library is "A1",
    // meaning that only the first cell in the spreadsheet is used.
    //
    // A quote from Apache POI library:
    // "Single cell ranges are formatted like single cell references (e.g. 'A1' instead of 'A1:A1')."
    //
    if (dimensions.length === 1) {
      dimensions = [dimensions[0], dimensions[0]]
    }
    return dimensions
  }
}

export function createInitialState() {
  return {
    dimension: false,
    ref: undefined
  }
}

export function onOpenTag(tagName, attributes, state) {
  if (tagName === 'dimension') {
    state.dimension = true
    state.ref = attributes.ref
  }
}

export function onCloseTag(tagName, state) {
  if (tagName === 'dimension') {
    state.dimension = false
  }
}

export function onText(text, state) {}
