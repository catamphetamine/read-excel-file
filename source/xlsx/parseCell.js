import parseExcelTimestamp from './parseExcelTimestamp.js'
import isDateFormatStyle from './isDateFormatStyle.js'

// An empty cell has `null` value.
const EMPTY_CELL_VALUE = null

// This variable represents a cell with a `null` value.
// It is exported only to be specified as a dependency when using `worker-f`.
export const EMPTY_CELL = [null, EMPTY_CELL_VALUE]

/**
 * Parses a cell from the info extracted from XML.
 * @param {string} [t] — `<c t/>` attribute value (cell type). One of: b (Boolean), e (Error), n (Number), d (Date), s (String).
 * @param {string} [s] — `<c s/>` attribute value (formatting style ID). When present, should be a stringified zero-based index of the formatting style for a numberic cell.
 * @param {string} [v] — `<v/>` element text content (value). Will be `undefined` if the `<v/>` element absent. Will be an empty string `""` if the `<v/>` element is present but is empty.
 * @param {string} [inlineString] — Inline string value.
 * @param {any[]} parameters
 * @returns {[string|null,string|number|boolean|null] | string} Either `[type, value]` or `error`, where `value` is the cell value, `type` depends on the type of `value` and could be one of: 's' (string), 'b' (boolean), 'n' (number string), 'd' (date timestamp), 'e' (formula cell error), `null` (null); `error` is an error message: `VALUE_MISSING`, `VALUE_INVALID`, `FORMAT_INVALID`, `TYPE_INVALID`.
 */
export default function parseCell(
  t,
  s,
  v,
  inlineString,
  [
    sharedStrings,
    styles,
    epoch1904,
    dateFormatDetectionCache,
    defaultDateFormat,
    dateTemplateParser,
    parseNumberCustom
  ]
) {
  // Available Excel cell types:
  // https://github.com/SheetJS/sheetjs/blob/19620da30be2a7d7b9801938a0b9b1fd3c4c4b00/docbits/52_datatype.md
  //
  // Some other document (seems to be old):
  // http://webapp.docx4java.org/OnlineDemo/ecma376/SpreadsheetML/ST_CellType.html
  //
  // The default cell type is "n" (numeric), according to XLSX specification.
  //
  switch (t || 'n') {
    // `t="str"` means that the cell value is calculated using a formula.
    // The formula is defined as the text of a child `<f/>` element.
    //
    // It could optionally include a `<v/>` element whose text is the cached result
    // of the calculation from the last time the file was saved in a spreadsheet editor application.
    //
    // An optional `<v/>` element holds a pre-computed result of the formula defined by `<f/>`.
    //
    // Example:
    //
    // <c r="B3" t="str">
    // 	<f>CONCATENATE(C1,D1)</f>
    // 	<v>C1ValueD1Value</v>
    // </c>
    //
    // Here's a guide on formulas in XLSX files:
    // https://github.com/MiniMax-AI/skills/blob/main/skills/minimax-xlsx/references/validate.md
    //
    case 'str':
      // The `<v/>` element could be absent because it's not required to be pre-computed by the spec.
      // In such case, `v` argument value would be `undefined`.
      // Because this package can't include the whole formula calculation engine,
      // it has to interpret this situation as an error.
      if (v === undefined) {
        return 'VALUE_MISSING'
      }
      // The `<v/>` element could be present but its text content could be empty
      // because the formula returns an empty string.
      // For example, a valid case of `v` argument value being an empty string `""` is when
      // a formula in cell `A1` is `=CONCATENATE(B1,C1)` and both `B1` and `C1` cells are empty.
      if (!v) {
        return EMPTY_CELL
      }
      return ['s', v]

    // `t="inlineStr"` means that `<is/>` holds the string value.
    //
    // Inside a `<c t="inlineStr"/>`, the specification requires there to exist an `<is/>` element,
    // and within that `<is/>` element it requires to exist a `<t/>` element.
    //
    // Example:
    //
    // <c r="A1" s="1" t="inlineStr">
    //   <is>
    //     <t>
    //       Test 123
    //     </t>
    //   </is>
    // </c>
    //
    case 'inlineStr':
      if (inlineString === undefined) {
        return 'VALUE_MISSING'
      }
      return ['s', inlineString]

    // `type="s"` means that the string value is stored in the Shared Strings Table.
    // This way it attempts to compress the `.xlsx` file by reusing all string values
    // in case they repeat throughout the spreadsheet.
    //
    // This optimization can't be used when writing an `.xlsx` file in a "streaming"
    // fashion, i.e. when the entire spreadsheet data is not known in adavance
    // at the start of writing the file.
    // But it can be used in all other situations. And hence, it is used.
    // So this is the most common cell type, actually.
    //
    // Example:
    //
    // <c r="A3" t="s">
    //   <v>3</v>
    // </c>
    //
    case 's':
      // If a cell has no value then there's no `<c/>` element for it.
      // If a `<c/>` element exists then it's not empty.
      // The `<v/>` element's text is a zero-based index in the "shared strings" dictionary.
      if (!v) {
        return 'VALUE_MISSING'
      }
      const sharedStringIndex = Number(v)
      // The shared string index value could be:
      // * not a number
      // * a number but a fractional one
      // * an integer that is out of bounds of the shared strings array
      if (isNaN(sharedStringIndex) || sharedStrings[sharedStringIndex] === undefined) {
        return 'VALUE_INVALID'
      }
      return ['s', sharedStrings[sharedStringIndex]]

    // Boolean (TRUE/FALSE) values are stored as either "1" or "0" in cells of type "b".
    //
    // Example:
    //
    // <c r="A1" t="b">
    //   <v>1</v>
    // </c>
    //
    case 'b':
      if (!v) {
        return 'VALUE_MISSING'
      }
      if (v === '1') {
        return ['b', true]
      }
      if (v === '0') {
        return ['b', false]
      }
      return 'VALUE_INVALID'

    // If cell type is "e", the `<v/>` element's text is an error code string (required).
    //
    // Example:
    //
    // <c r="A1" t="e">
    //   <f>1/0</f>
    //   <v>#DIV/0!</v>
    // </c>
    //
    case 'e':
      // Examples of error codes:
      //
      // '#NULL!'
      // '#DIV/0!'
      // '#VALUE!'
      // '#REF!'
      // '#NAME!'
      // '#NUM!'
      // '#N/A'
      // '#SPILL!'
      //
      // The description of each error could be read in the formulas guide:
      // https://github.com/MiniMax-AI/skills/blob/main/skills/minimax-xlsx/references/validate.md
      //
      if (!v) {
        return 'VALUE_MISSING'
      }
      return ['e', v]

    // XLSX supports date cells of type "d", though it seems like it (almost?) never
    // uses type "d" for storing dates, preferring type "n" and numeric timestamp instead.
    // The value of a "d" cell is supposedly a string in "ISO 8601" format.
    // I haven't seen an `.xlsx` file having such cells.
    //
    // Example:
    //
    // <c r="A1" s="1" t="d">
    //   <v>
    //     2021-06-10T00:47:45.700Z
    //   </v>
    // </c>
    //
    case 'd':
      if (!v) {
        return EMPTY_CELL
      }
      const parsedDate = new Date(v)
      if (isNaN(parsedDate.valueOf())) {
        return 'VALUE_INVALID'
      }
      return ['d', parsedDate.getTime()]

    // type "n" is used for numeric cells.
    //
    // An optional `s` attribute defines how this number should be formatted — 
    // it should be a zero-based index of the style (XF record) in `styles.xml`.
    //
    // Example:
    //
    // <c r="A1" s="1" t="n">
    //   <v>123.45</v>
    // </c>
    //
    case 'n':
      // Numeric cell value is allowed to be missing in the XLSX specification
      // because "n" is the default type of a cell, so it ends up representing empty cells too.
      if (!v) {
        return EMPTY_CELL
      }
      // XLSX does support `type: "d"` cells for storing dates, but it's not commonly used.
      // Instead, it prefers using `type: "n"` cells for storing dates as timestamps
      // with a corresponding `s` formatting style.
      if (s) {
        const styleId = Number(s)
        // The style ID value could be:
        // * not a number
        // * a number but a fractional one
        // * an integer that is out of bounds of the styles array
        if (isNaN(styleId) || styles[styleId] === undefined) {
          return 'FORMAT_INVALID'
        }
        // Whether it's a date cell or just a numeric cell could only be determined
        // by looking at the formatting style.
        if (isDateFormatStyle(styles[styleId], defaultDateFormat, dateTemplateParser, dateFormatDetectionCache)) {
          const timestamp = Number(v)
          if (isNaN(timestamp)) {
            return 'VALUE_INVALID'
          }
          // First, parse the "serial date" number from string.
          // Then convert the "serial date" number to a date timestamp.
          return ['d', parseExcelTimestamp(timestamp, epoch1904)]
        }
      }
      // Return the cell value as a number,
      // unless custom `parseNumber()` function was passed,
      // in which case return the number as an unparsed string.
      // Some people prefer passing a custom `parseNumber()` function
      // to parse "big integers" without losing any precision.
      if (parseNumberCustom) {
        return ['n', v]
      }
      const number = Number(v)
      if (isNaN(number)) {
        return 'VALUE_INVALID'
      }
      return ['n', number]

    default:
      return 'TYPE_INVALID'
  }
}