import parseCells from './parseCells'
import parseDimensions from './parseDimensions'

import { calculateDimensions } from './coordinates'

export default function parseSheet(content, xml, values, styles, properties, options) {
  const sheet = xml.createDocument(content)

  const cells = parseCells(sheet, xml, values, styles, properties, options)
  const dimensions = parseDimensions(sheet) || calculateDimensions(cells)

  return { cells, dimensions }
}