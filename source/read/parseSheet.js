import parseCells from './parseCells.js'
import parseDimensions from './parseDimensions.js'

import { calculateDimensions, parseCellCoordinates } from './coordinates.js'
import { getMergedCells } from '../xml/xlsx.js'

export default function parseSheet(content, xml, values, styles, properties, options) {
  const sheet = xml.createDocument(content)

  const cells = parseCells(sheet, xml, values, styles, properties, options)

  const mergedCells = []
  // const mergedCells = getMergedCells(sheet)
  for (const mergedCell of getMergedCells(sheet)) {
    const [from, to] = mergedCell.split(':').map(parseCellCoordinates)
    // console.log('Merged Cell.', 'From:', from, 'To:', to)
    mergedCells.push({ from, to })
  }

  // `dimensions` defines the spreadsheet area containing all non-empty cells.
  // https://docs.microsoft.com/en-us/dotnet/api/documentformat.openxml.spreadsheet.sheetdimension?view=openxml-2.8.1
  const dimensions = parseDimensions(sheet) || calculateDimensions(cells)

  return { cells, dimensions, mergedCells }
}