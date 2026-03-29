import parseCells from './parseCells.js'
import parseSheetDimensions from './parseSheetDimensions.js'
import reconstructSheetDimensionsFromSheetCells from './reconstructSheetDimensionsFromSheetCells.js'
import convertSheetToData2dArray from './convertCellsToData2dArray.js'

export default function parseSheet(content, xml, sharedStrings, styles, epoch1904, options) {
  const sheetDocument = xml.createDocument(content)

  const cells = parseCells(sheetDocument, sharedStrings, styles, epoch1904, options)

  // `dimensions` defines the spreadsheet area enclosing all non-empty cells.
  // https://docs.microsoft.com/en-us/dotnet/api/documentformat.openxml.spreadsheet.sheetdimension?view=openxml-2.8.1
  const dimensions = parseSheetDimensions(sheetDocument) || reconstructSheetDimensionsFromSheetCells(cells)

  return convertSheetToData2dArray(cells, dimensions)
}