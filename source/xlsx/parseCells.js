import { getCellElements } from '../xml/xlsx.js'

import parseCell from './parseCell.js'

export default function parseCells(sheetDocument, sharedStrings, styles, epoch1904, options) {
  const cells = getCellElements(sheetDocument)

  if (cells.length === 0) {
    return []
  }

  // It seems like the idea of parsing "merged cells" was abandoned without being finished.
  // Here, it seems to just get to the stage of parsing merged cell coordinates.
  // Perhaps it's because it's not clear how would the package return merged cell results.
  // I.e. should it just duplicate the value in each one of the merged cells?
  // Or should it keep the existing behavior of only returning the value of the top-most left-most cell
  // and then return `null` for the other ones?
  // Perhaps the latter (existing) approach was found to be the most sensible.
  //
  // const mergedCells = getMergedCellCoordinates(sheetDocument)
  // for (const mergedCell of mergedCells) {
  //   const [from, to] = mergedCell.split(':').map(parseCellCoordinates)
  //   console.log('Merged Cell.', 'From:', from, 'To:', to)
  // }

  return cells.map((element) => {
    return parseCell(element, sheetDocument, sharedStrings, styles, epoch1904, options)
  })
}