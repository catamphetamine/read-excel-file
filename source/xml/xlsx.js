import { findChild, findChildren, forEach, map, getTagName } from './dom.js'

// Returns an array of cells,
// each element being an XML DOM element representing a cell.
export function getCells(document) {
  const worksheet = document.documentElement
  const sheetData = findChild(worksheet, 'sheetData')

  const cells = []
  forEach(sheetData, 'row', (row) => {
    forEach(row, 'c', (cell) => {
      cells.push(cell)
    })
  })
  return cells
}

export function getMergedCells(document) {
  const worksheet = document.documentElement
  const mergedCells = findChild(worksheet, 'mergeCells')
  const mergedCellsInfo = []
  if (mergedCells) {
    forEach(mergedCells, 'mergeCell', (mergedCell) => {
      mergedCellsInfo.push(mergedCell.getAttribute('ref'))
    })
  }
  return mergedCellsInfo
}

export function getCellValue(document, node) {
  return findChild(node, 'v')
}

export function getCellInlineStringValue(document, node) {
  if (
    node.firstChild &&
    getTagName(node.firstChild) === 'is' &&
    node.firstChild.firstChild &&
    getTagName(node.firstChild.firstChild) === 't'
  ) {
    return node.firstChild.firstChild.textContent
  }
}

export function getDimensions(document) {
  const worksheet = document.documentElement
  const dimensions = findChild(worksheet, 'dimension')
  if (dimensions) {
    return dimensions.getAttribute('ref')
  }
}

export function getBaseStyles(document) {
  const styleSheet = document.documentElement
  const cellStyleXfs = findChild(styleSheet, 'cellStyleXfs')
  if (cellStyleXfs) {
    return findChildren(cellStyleXfs, 'xf')
  }
  return []
}

export function getCellStyles(document) {
  const styleSheet = document.documentElement
  const cellXfs = findChild(styleSheet, 'cellXfs')
  if (!cellXfs) {
    return []
  }
  return findChildren(cellXfs, 'xf')
}

export function getNumberFormats(document) {
  const styleSheet = document.documentElement
  let numberFormats = []
  const numFmts = findChild(styleSheet, 'numFmts')
  if (numFmts) {
    return findChildren(numFmts, 'numFmt')
  }
  return []
}

export function getSharedStrings(document) {
	// An `<si/>` element can contain a `<t/>` (simplest case) or a set of `<r/>` ("rich formatting") elements having `<t/>`.
	// https://docs.microsoft.com/en-us/dotnet/api/documentformat.openxml.spreadsheet.sharedstringitem?redirectedfrom=MSDN&view=openxml-2.8.1
	// http://www.datypic.com/sc/ooxml/e-ssml_si-1.html

  const sst = document.documentElement
  return map(sst, 'si', string => {
    const t = findChild(string, 't')
    if (t) {
      return t.textContent
    }
    let value = ''
    forEach(string, 'r', (r) => {
      value += findChild(r, 't').textContent
    })
    return value
  })
}

export function getWorkbookProperties(document) {
  const workbook = document.documentElement
  return findChild(workbook, 'workbookPr')
}

export function getRelationships(document) {
  const relationships = document.documentElement
  return findChildren(relationships, 'Relationship')
}

export function getSheets(document) {
  const workbook = document.documentElement
  const sheets = findChild(workbook, 'sheets')
  return findChildren(sheets, 'sheet')
}