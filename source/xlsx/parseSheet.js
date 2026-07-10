import parseSheetData, {
  createInitialStateInSheetData,
  onOpenTagInSheetData,
  onCloseTagInSheetData,
  onTextInSheetData
} from './parseSheetData.js'

import parseCellAddress from './parseCellAddress.js'

import reconstructSheetDimensionsFromSheetCells from './reconstructSheetDimensionsFromSheetCells.js'
import convertSheetToData2dArray from './convertCellsToData2dArray.js'

/**
 * Parses a `sheet.xml` file.
 * @param {string} content
 * @param {function} parseXmlStream — SAX XML parser.
 * @param {object} options
 * @returns {Promise<SheetData>}
 */
export default function parseSheet(content, parseXmlStream, { sharedStrings, styles, epoch1904, options }) {
  // When XML parser is finished, it returns a `state`
  // where it has accumulated the cells it encountered during parsing.
  // `getSheetData()` function reads the parser `state` and transforms it to `SheetData`.
  const getSheetData = (state) => {
    const cells = parseSheetData(state.sheetData, sharedStrings, styles, epoch1904, options)
    const dimensions = state.dimension
      ? parseSheetDimensionRef(state.dimension)
      : reconstructSheetDimensionsFromSheetCells(cells)
    return convertSheetToData2dArray(cells, dimensions)
  }

  return parseXmlStream(content, {
    createInitialState: createInitialStateInSheet,
    onOpenTag: onOpenTagInSheet,
    onCloseTag: onCloseTagInSheet,
    onText: onTextInSheet
  }).then((state) => {
    return getSheetData(state)
  })
}

function createInitialStateInSheet() {
  return {
    dimension: undefined,
    sheetData: undefined
  }
}

function onOpenTagInSheet(tagName, attributes, state) {
  if (tagName === 'dimension') {
    state.dimension = attributes.ref
  } else if (tagName === 'sheetData') {
    state.sheetData = createInitialStateInSheetData()
  } else if (state.sheetData) {
    onOpenTagInSheetData(tagName, attributes, state.sheetData)
  }
}

function onCloseTagInSheet(tagName, state) {
  if (state.sheetData) {
    onCloseTagInSheetData(tagName, state.sheetData)
  }
}

function onTextInSheet(text, state) {
  if (state.sheetData) {
    onTextInSheetData(text, state.sheetData)
  }
}

/**
 * Sheet "dimension" defines the spreadsheet area containing all non-empty cells.
 * Any cells outside the "dimension" are considered empty and should be ignored.
 * https://docs.microsoft.com/en-us/dotnet/api/documentformat.openxml.spreadsheet.sheetdimension?view=openxml-2.8.1
 * @param {string} `ref` — The value of `<dimension ref/>` attribute.
 * @returns {object[]} `undefined` or `[{ row, column }, { row, column }]` — "From row number and column number to row number and column number".
 */
function parseSheetDimensionRef(ref) {
  let dimensions = ref.split(':').map(parseCellAddress).map(
    ([row, column]) => ({ row, column })
  )
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