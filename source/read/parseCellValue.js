import parseDate from './parseDate'

// https://hexdocs.pm/xlsxir/number_styles.html
const BUILT_IN_DATE_NUMBER_FORMAT_IDS = [14,15,16,17,18,19,20,21,22,27,30,36,45,46,47,50,57]

export default function getCellValue(value, type, {
	getInlineStringValue,
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
    // If the cell contains formula string.
    case 'str':
      value = value.trim()
      if (value === '') {
        value = undefined
      }
      break

    // If the cell contains an "inline" (not "shared") string.
    case 'inlineStr':
      value = getInlineStringValue()
      if (value === undefined) {
        throw new Error(`Unsupported "inline string" cell value structure`) // : ${cellNode.textContent}`)
      }
      value = value.trim()
      if (value === '') {
        value = undefined
      }
      break

    // If the cell contains a "shared" string.
    // "Shared" strings is a way for an Excel editor to reduce
    // the file size by storing "commonly used" strings in a dictionary
    // and then referring to such strings by their index in that dictionary.
    case 's':
      // If a cell has no value then there's no `<c/>` element for it.
      // If a `<c/>` element exists then it's not empty.
      // The `<v/>`alue is a key in the "shared strings" dictionary of the
      // XLSX file, so look it up in the `values` dictionary by the numeric key.
      value = values[parseInt(value)]
      value = value.trim()
      if (value === '') {
        value = undefined
      }
      break

    case 'b':
      value = value === '1' ? true : false
      break

    // Stub: blank stub cell that is ignored by data processing utilities.
    case 'z':
      value = undefined
      break

    // Error: `value` is a numeric code.
    // They also wrote: "and `w` property stores its common name".
    // It's unclear what they meant by that.
    case 'e':
      value = decodeError(value)
      break

    // Date: a string to be parsed as a date.
    // (usually a string in "ISO 8601" format)
    case 'd':
      if (value === undefined) {
        break
      }
      value = new Date(value)
      break

    case 'n':
      if (value === undefined) {
        break
      }
      value = parseFloat(value)
      // XLSX does have "d" type for dates, but it's not commonly used.
      // Instead, spreadsheets prefer using "n" type for dates for some reason.
      //
      // In such cases, sometimes a "date" type could be heuristically detected
      // by looking at such numeric value "format" and seeing if it's a date-specific one.
      // https://github.com/catamphetamine/read-excel-file/issues/3#issuecomment-395770777
      //
      // The list of generic numeric value "formats":
      // https://xlsxwriter.readthedocs.io/format.html#format-set-num-format
      //
      const styleId = getStyleId()
      if (styleId) {
        // styleId = parseInt(styleId)
        const style = styles[styleId]
        if (!style) {
          throw new Error(`Cell style not found: ${styleId}`)
        }
        if (BUILT_IN_DATE_NUMBER_FORMAT_IDS.indexOf(parseInt(style.numberFormat.id)) >= 0 ||
          (options.dateFormat && style.numberFormat.template === options.dateFormat) ||
          (options.smartDateParser !== false && style.numberFormat.template && isDateTemplate(style.numberFormat.template))) {
          value = parseDate(value, properties)
        }
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

function isDateTemplate(template) {
  // Date format tokens could be in upper case or in lower case.
  // There seems to be no single standard.
  // So lowercase the template first.
  template = template.toLowerCase()
  const tokens = template.split(/\W+/)
  for (const token of tokens) {
    if (DATE_TEMPLATE_TOKENS.indexOf(token) < 0) {
      return false
    }
  }
  return true
}

// These tokens could be in upper case or in lower case.
// There seems to be no single standard, so using lower case.
const DATE_TEMPLATE_TOKENS = [
  // Seconds (min two digits). Example: "05".
  'ss',
  // Minutes (min two digits). Example: "05". Could also be "Months". Weird.
  'mm',
  // Hours. Example: "1".
  'h',
  // Hours (min two digits). Example: "01".
  'hh',
  // "AM" part of "AM/PM". Lowercased just in case.
  'am',
  // "PM" part of "AM/PM". Lowercased just in case.
  'pm',
  // Day. Example: "1"
  'd',
  // Day (min two digits). Example: "01"
  'dd',
  // Month (numeric). Example: "1".
  'm',
  // Month (numeric, min two digits). Example: "01". Could also be "Minutes". Weird.
  'mm',
  // Month (shortened month name). Example: "Jan".
  'mmm',
  // Month (full month name). Example: "January".
  'mmmm',
  // Two-digit year. Example: "20".
  'yy',
  // Full year. Example: "2020".
  'yyyy'
];