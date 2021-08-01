import {
  parseCellCoordinates
} from './coordinates'

import {
  getDimensions
} from '../xml/xlsx'

export default function parseDimensions(sheet) {
  let dimensions = getDimensions(sheet)
  if (dimensions) {
    dimensions = dimensions.split(':').map(parseCellCoordinates).map(([row, column]) => ({
      row,
      column
    }))
    // When there's only a single cell on a sheet
    // there can sometimes be just "A1" for the dimensions string.
    if (dimensions.length === 1) {
      dimensions = [dimensions[0], dimensions[0]]
    }
    return dimensions
  }
}

