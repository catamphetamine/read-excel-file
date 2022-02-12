import {
  parseCellCoordinates
} from './coordinates'

import {
  getDimensions
} from '../xml/xlsx'

// `dimensions` defines the spreadsheet area containing all non-empty cells.
// https://docs.microsoft.com/en-us/dotnet/api/documentformat.openxml.spreadsheet.sheetdimension?view=openxml-2.8.1
export default function parseDimensions(sheet) {
  let dimensions = getDimensions(sheet)
  if (dimensions) {
    dimensions = dimensions.split(':').map(parseCellCoordinates).map(([row, column]) => ({
      row,
      column
    }))
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
}

