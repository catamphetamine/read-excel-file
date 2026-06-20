import { findChild, findChildren, forEach, map, getFirstElementChild, getTagName } from './dom.js'

export function readSharedStrings(document, onOpenTag, onCloseTag, onText, state) {
  const sst = document.documentElement
  onOpenTag('sst', null, state)
	// An `<si/>` element can contain a `<t/>` (simplest case) or a set of `<r/>` ("rich formatting") elements having `<t/>`.
	// https://docs.microsoft.com/en-us/dotnet/api/documentformat.openxml.spreadsheet.sharedstringitem?redirectedfrom=MSDN&view=openxml-2.8.1
	// http://www.datypic.com/sc/ooxml/e-ssml_si-1.html
  map(sst, 'si', (si) => {
    onOpenTag('si', null, state)
    const t = findChild(si, 't')
    if (t) {
      onOpenTag('t', null, state)
      onText(t.textContent, state)
      onCloseTag('t', state)
    } else {
      forEach(si, 'r', (r) => {
        onOpenTag('r', null, state)
        onOpenTag('t', null, state)
        onText(findChild(r, 't').textContent, state)
        onCloseTag('t', state)
        onCloseTag('r', state)
      })
    }
    onCloseTag('si', state)
  })
  onCloseTag('sst', state)
}

export function readSheetDimensions(document, onOpenTag, onCloseTag, onText, state) {
  const worksheet = document.documentElement
  onOpenTag('worksheet', null, state)
  const dimensions = findChild(worksheet, 'dimension')
  if (dimensions) {
    onOpenTag('dimension', { ref: dimensions.getAttribute('ref') }, state)
    onCloseTag('dimension', state)
  }
  onCloseTag('worksheet', state)
}

export function readCells(document, onOpenTag, onCloseTag, onText, state) {
  const worksheet = document.documentElement
  onOpenTag('worksheet', null, state)

  const sheetData = findChild(worksheet, 'sheetData')

  forEach(sheetData, 'row', (row) => {
    onOpenTag('row', null, state)
    forEach(row, 'c', (cell) => {
      const attributes = {
        r: cell.getAttribute('r'),
        t: cell.getAttribute('t'),
        s: cell.getAttribute('s')
      }
      onOpenTag('c', attributes, state)
      // A cell could have either a value or an insline string value.
      // * Cell value is stored as text content of a `<v>...</v>` element.
      // * Inline string value is stored as text content of an `<is><t>...</t></is>` element.
      readCellValueElement(document, cell, onOpenTag, onCloseTag, onText, state)
      readCellInlineStringValue(document, cell, onOpenTag, onCloseTag, onText, state)
      onCloseTag('c', state)
    })
    onCloseTag('row', state)
  })

  onCloseTag('worksheet', state)
}

export function getMergedCellCoordinates(document) {
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

function readCellValueElement(document, element, onOpenTag, onCloseTag, onText, state) {
  const v = findChild(element, 'v')
  if (v) {
    onOpenTag('v', null, state)
    if (typeof v.textContent === 'string') {
      onText(v.textContent, state)
    }
    onCloseTag('v', state)
  }
}

function readCellInlineStringValue(document, element, onOpenTag, onCloseTag, onText, state) {
  // It seems as if in some weirdly-output "*.xlsx" files
  // there're non-element nodes of some weird nature.
  // https://gitlab.com/catamphetamine/read-excel-file/-/issues/109
  // This code filters out such weird non-element nodes.
  const firstElementChild = getFirstElementChild(element)
  if (firstElementChild && getTagName(firstElementChild) === 'is') {
    onOpenTag('is', null, state)
    const firstElementChildFirstElementChild = getFirstElementChild(firstElementChild)
    if (firstElementChildFirstElementChild && getTagName(firstElementChildFirstElementChild) === 't') {
      onOpenTag('t', null, state)
      if (typeof firstElementChildFirstElementChild.textContent === 'string') {
        onText(firstElementChildFirstElementChild.textContent, state)
      }
      onCloseTag('t', state)
    }
    onCloseTag('is', state)
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