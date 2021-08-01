import parseCell from './parseCell'

import {
  getCells,
  getMergedCells
} from '../xml/xlsx'

export default function parseCells(sheet, xml, values, styles, properties, options) {
  const cells = getCells(sheet)

  if (cells.length === 0) {
    return []
  }

  // const mergedCells = getMergedCells(sheet)
  // for (const mergedCell of mergedCells) {
  //   const [from, to] = mergedCell.split(':').map(parseCellCoordinates)
  //   console.log('Merged Cell.', 'From:', from, 'To:', to)
  // }

  return cells.map((node) => {
    return parseCell(node, sheet, xml, values, styles, properties, options)
  })
}