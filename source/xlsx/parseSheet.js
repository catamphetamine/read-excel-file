import parseSheetDimensions, {
  createInitialState as createInitialStateForSheetDimensions,
  onOpenTag as onOpenTagPotentiallyRelatedToSheetDimensions,
  onCloseTag as onCloseTagPotentiallyRelatedToSheetDimensions,
  onText as onTextPotentiallyRelatedToSheetDimensions
} from './parseSheetDimensions.js'

import parseCells, {
  createInitialState as createInitialStateForCells,
  onOpenTag as onOpenTagPotentiallyRelatedToCells,
  onCloseTag as onCloseTagPotentiallyRelatedToCells,
  onText as onTextPotentiallyRelatedToCells
} from './parseCells.js'

import { readSheetDimensions, readCells } from '../xml/xlsx.js'

import reconstructSheetDimensionsFromSheetCells from './reconstructSheetDimensionsFromSheetCells.js'
import convertSheetToData2dArray from './convertCellsToData2dArray.js'

/**
 * Parses a `sheet.xml` file.
 * @param {string} content
 * @param {function} parseXmlTree — Parses an XML string into a DOM tree.
 * @param {function} [parseXmlStream] — (optional) "streaming" XML parser. Using "streaming" also requires Node.js because it uses Node.js streams.
 * @param {object} options
 * @returns {Promise<SheetData>}
 */
export default function parseSheet(content, parseXmlTree, parseXmlStream, { sharedStrings, styles, epoch1904, options }) {
  // When XML parser is finished, it returns a `state`
  // where it has accumulated the cells it encountered during parsing.
  // `getSheetData()` function reads the parser `state` and transforms it to `SheetData`.
  const getSheetData = (state) => {
    const cells = parseCells(state.stateForCells, sharedStrings, styles, epoch1904, options)
    // `dimensions` defines the spreadsheet area enclosing all non-empty cells.
    // https://docs.microsoft.com/en-us/dotnet/api/documentformat.openxml.spreadsheet.sheetdimension?view=openxml-2.8.1
    const dimensions = parseSheetDimensions(state.stateForSheetDimensions) || reconstructSheetDimensionsFromSheetCells(cells)
    return convertSheetToData2dArray(cells, dimensions)
  }

  if (parseXmlStream) {
    return parseXmlStream(content, {
      createInitialState,
      onOpenTag,
      onCloseTag,
      onText
    }).then((state) => {
      return getSheetData(state)
    })
  } else {
    return new Promise((resolve) => {
      const state = createInitialState()
      const document = parseXmlTree(content)
      readSheetDimensions(document, onOpenTag, onCloseTag, onText, state)
      readCells(document, onOpenTag, onCloseTag, onText, state)
      resolve(getSheetData(state))
    })
  }
}

function createInitialState() {
  return {
    stateForCells: createInitialStateForCells(),
    stateForSheetDimensions: createInitialStateForSheetDimensions()
  }
}

function onOpenTag(tagName, attributes, state) {
  onOpenTagPotentiallyRelatedToCells(tagName, attributes, state.stateForCells)
  onOpenTagPotentiallyRelatedToSheetDimensions(tagName, attributes, state.stateForSheetDimensions)
}

function onCloseTag(tagName, state) {
  onCloseTagPotentiallyRelatedToCells(tagName, state.stateForCells)
  onCloseTagPotentiallyRelatedToSheetDimensions(tagName, state.stateForSheetDimensions)
}

function onText(text, state) {
  onTextPotentiallyRelatedToCells(text, state.stateForCells)
  onTextPotentiallyRelatedToSheetDimensions(text, state.stateForSheetDimensions)
}