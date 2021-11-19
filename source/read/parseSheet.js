import parseCells from './parseCells'
import parseDimensions from './parseDimensions'

import { calculateDimensions } from './coordinates'

export default function parseSheet(content, xml, values, styles, properties, options) {
  const sheet = xml.createDocument(content)

  const cells = parseCells(sheet, xml, values, styles, properties, options)

  // `dimensions` defines the spreadsheet area containing all non-empty cells.
  // https://docs.microsoft.com/en-us/dotnet/api/documentformat.openxml.spreadsheet.sheetdimension?view=openxml-2.8.1
  const dimensions = parseDimensions(sheet) || calculateDimensions(cells)

  return { cells, dimensions }
}