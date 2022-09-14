import parseDate from './parseDate.js'
import isDateTimestamp from './isDateTimestamp.js'

// Parses a string `value` of a cell.
export default function parseCellValue(value, type, {
  getInlineStringValue,
  getInlineStringXml,
  getStyleId,
  styles,
  values,
  properties,
  options
}) {
  if (!type) {
    // Default cell type is "n" (numeric).
    // http://www.datypic.com/sc/ooxml/t-ssml_CT_Cell.html
    type = 'n'
  }

  // Available Excel cell types:
  // https://github.com/SheetJS/sheetjs/blob/19620da30be2a7d7b9801938a0b9b1fd3c4c4b00/docbits/52_datatype.md
  //
  // Some other document (seems to be old):
  // http://webapp.docx4java.org/OnlineDemo/ecma376/SpreadsheetML/ST_CellType.html
  //
  switch (type) {
    // XLSX tends to store all strings as "shared" (indexed) ones
    // using "s" cell type (for saving on strage space).
    // "str" cell type is then generally only used for storing
    // formula-pre-calculated cell values.
    case 'str':
      value = parseString(value, options)
      break

    // Sometimes, XLSX stores strings as "inline" strings rather than "shared" (indexed) ones.
    // Perhaps the specification doesn't force it to use one or another.
    // Example: `<sheetData><row r="1"><c r="A1" s="1" t="inlineStr"><is><t>Test 123</t></is></c></row></sheetData>`.
    case 'inlineStr':
      value = getInlineStringValue()
      if (value === undefined) {
        throw new Error(`Unsupported "inline string" cell value structure: ${getInlineStringXml()}`)
      }
      value = parseString(value, options)
      break

    // XLSX tends to store string values as "shared" (indexed) ones.
    // "Shared" strings is a way for an Excel editor to reduce
    // the file size by storing "commonly used" strings in a dictionary
    // and then referring to such strings by their index in that dictionary.
    // Example: `<sheetData><row r="1"><c r="A1" s="1" t="s"><v>0</v></c></row></sheetData>`.
    case 's':
      // If a cell has no value then there's no `<c/>` element for it.
      // If a `<c/>` element exists then it's not empty.
      // The `<v/>`alue is a key in the "shared strings" dictionary of the
      // XLSX file, so look it up in the `values` dictionary by the numeric key.
      const sharedStringIndex = Number(value)
      if (isNaN(sharedStringIndex)) {
        throw new Error(`Invalid "shared" string index: ${value}`)
      }
      if (sharedStringIndex >= values.length) {
        throw new Error(`An out-of-bounds "shared" string index: ${value}`)
      }
      value = values[sharedStringIndex]
      value = parseString(value, options)
      break

    // Boolean (TRUE/FALSE) values are stored as either "1" or "0"
    // in cells of type "b".
    case 'b':
      if (value === '1') {
        value = true
      } else if (value === '0') {
        value = false
      } else {
        throw new Error(`Unsupported "boolean" cell value: ${value}`)
      }
      break

    // XLSX specification seems to support cells of type "z":
    // blank "stub" cells that should be ignored by data processing utilities.
    case 'z':
      value = undefined
      break

    // XLSX specification also defines cells of type "e" containing a numeric "error" code.
    // It's not clear what that means though.
    // They also wrote: "and `w` property stores its common name".
    // It's unclear what they meant by that.
    case 'e':
      value = decodeError(value)
      break

    // XLSX supports date cells of type "d", though seems like it (almost?) never
    // uses it for storing dates, preferring "n" numeric timestamp cells instead.
    // The value of a "d" cell is supposedly a string in "ISO 8601" format.
    // I haven't seen an XLSX file having such cells.
    // Example: `<sheetData><row r="1"><c r="A1" s="1" t="d"><v>2021-06-10T00:47:45.700Z</v></c></row></sheetData>`.
    case 'd':
      if (value === undefined) {
        break
      }
      const parsedDate = new Date(value)
      if (isNaN(parsedDate.valueOf())) {
        throw new Error(`Unsupported "date" cell value: ${value}`)
      }
      value = parsedDate
      break

    // Numeric cells have type "n".
    case 'n':
      if (value === undefined) {
        break
      }
      const parsedNumber = Number(value)
      if (isNaN(parsedNumber)) {
        throw new Error(`Invalid "numeric" cell value: ${value}`)
      }
      value = parsedNumber
      // XLSX does have "d" type for dates, but it's not commonly used.
      // Instead, it prefers using "n" type for storing dates as timestamps.
      if (isDateTimestamp(value, getStyleId(), styles, options)) {
        // Parse the number as a date timestamp.
        value = parseDate(value, properties)
      }
      break

    default:
      throw new TypeError(`Cell type not supported: ${type}`)
  }

  // Convert empty values to `null`.
  if (value === undefined) {
    value = null
  }

  return value
}

// Decodes numeric error code to a string code.
// https://github.com/SheetJS/sheetjs/blob/19620da30be2a7d7b9801938a0b9b1fd3c4c4b00/docbits/52_datatype.md
function decodeError(errorCode) {
  // While the error values are determined by the application,
  // the following are some example error values that could be used:
  switch (errorCode) {
    case 0x00:
      return '#NULL!'
    case 0x07:
      return '#DIV/0!'
    case 0x0F:
      return '#VALUE!'
    case 0x17:
      return '#REF!'
    case 0x1D:
      return '#NAME?'
    case 0x24:
      return '#NUM!'
    case 0x2A:
      return '#N/A'
    case 0x2B:
      return '#GETTING_DATA'
    default:
      // Such error code doesn't exist. I made it up.
      return `#ERROR_${errorCode}`
  }
}

function parseString(value, options) {
  // In some weird cases, a developer might want to disable
  // the automatic trimming of all strings.
  // For example, leading spaces might express a tree-like hierarchy.
  // https://github.com/catamphetamine/read-excel-file/pull/106#issuecomment-1136062917
  if (options.trim !== false) {
    value = value.trim()
  }
  if (value === '') {
    value = undefined
  }
  return value
}