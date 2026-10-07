import parseCell, { EMPTY_CELL } from './parseCell.js'
import parseCellAddress from './parseCellAddress.js'
import InvalidSpreadsheetError from './InvalidSpreadsheetError.js'

// An empty cell has `null` value.
const EMPTY_CELL_VALUE = null

/**
 * Parses a `sheet.xml` file.
 * @param {string} content
 * @param {function} parseXml — SAX XML parser.
 * @param {object} options
 * @returns {Promise<SheetData>}
 */
export default function parseSheet(content, parseXml, { sharedStrings, styles, epoch1904, options }) {
  const parseCellParameters = [
    sharedStrings,
    styles,
    epoch1904,
    options.dateFormat, // defaultDateFormat
    options.smartDateParser !== false, // dateTemplateParser
    options.parseNumber // parseNumberCustom
  ]

  let rows = []
  let errors = []

  const state = createInitialState()

  return parseXml(
    content,
    state,
    onOpenTag,
    onCloseTag,
    onText,
    onProgress
  ).then(() => {
    const { rowCount, columnCount, dataRowCount, dataColumnCount } = state.sheetData
    // Drop (discard) empty rows at the bottom.
    if (dataRowCount < rowCount) {
      rows = rows.slice(0, dataRowCount)
    }
    // Drop (discard) empty columns at the right side.
    if (dataColumnCount < columnCount) {
      let i = 0
      while (i < rows.length) {
        if (rows[i].length > dataColumnCount) {
          rows[i] = rows[i].slice(0, dataColumnCount)
        }
        i++
      }
    }
    const startedAt = Date.now()
    // Add `null` values where there're "gaps" at the right side of rows.
    for (const row of rows) {
      while (row.length < dataColumnCount) {
        row.push(EMPTY_CELL_VALUE)
      }
    }
    return rows
  })

  function createInitialState() {
    return {
      dimension: undefined,
      sheetData: undefined
    }
  }

  function getRowsFromState(state) {
    return state.sheetData.rows
  }

  function setRowsInState(state, rows) {
    state.sheetData.rowIndexShift += state.sheetData.rows.length - rows.length
    state.sheetData.rows = rows
  }

  function getErrorsFromState(state) {
    return state.sheetData.errors
  }

  function setErrorsInState(state, errors) {
    state.sheetData.errors = errors
  }

  // Throw an error as soon as a non-recoverable error is encountered when parsing a cell.
  const THROW_ON_FIRST_CELL_ERROR = true

  function throwInvalidCellError({ row, column, error }) {
    // The sheet name or index is unknown, so it's not reported here.
    throw new InvalidSpreadsheetError(`<c/> at row ${row}, col ${column}: ${error}`)
  }

  function onProgress(end) {
    // A worksheet can contain enough metadata before `<sheetData/>` to span
    // multiple XML parsing chunks. There are no rows to finalize until the
    // parser has reached that element.
    if (!state.sheetData) {
      return
    }

    // Here, it could look at `state.dimension?` in order to avoid reading unused cells.
    // For example, there could be a sheet with a million rows and a million columns
    // but only the top-left cell in that sheet would be not an empty cell.
    // The rest of the cells could be empty, but it would be valid for such sheet to exist.
    // So there would be empty `<row/>` or `<c/>` elements all around, and those could be skipped
    // if `<dimension/>` element is present in the `sheet.xml` file.
    // The `<dimension/>` element tells which area of the sheet really contains non-empty data.
    // But it's an optional element, and also there's an additional question of:
    // "What should happen if an .xlsx writer sets it erroneously? Should it auto-repair such sheet?".
    // I imagine, such situations aren't really possible in real life but still mathematically it's possible,
    // because the `<dimension/>` element is more of a "supplementary" or "advisory" one
    // and it's not supposed to "break" anything in case its value is incorrect.
    // So that's why `read-excel-file` just simply ignores the `<dimension/>` element
    // even though it can read and "understand" it.
    // console.log(state.dimension)
    const rowsRead = getRowsFromState(state)
    const errorsEncountered = getErrorsFromState(state)
    if (end) {
      rows = rows.concat(rowsRead)
      errors = errors.concat(errorsEncountered)
      if (errors.length > 0) {
        throwInvalidCellError(errors[0])
      }
    } else {
      if (rowsRead.length > 1) {
        // The rows except for the last one have already been "finalized",
        // i.e. it can be said that those rows don't have any more cells yet to be parsed.
        // The last row is still being read so it's not "finalized" yet,
        // i.e. it's unknown at this point whether there will be more cells of it.
        const finalizedRows = rowsRead.slice(0, -1)
        // Move the finalized rows from the "in-progress" rows to the "result" rows.
        rows = rows.concat(finalizedRows)
        // Add any errors that have been encountered while parsing this chunk of rows.
        errors = errors.concat(errorsEncountered)
        // Proceeed with just the last row and the next chunk.
        setRowsInState(state, rowsRead.slice(-1))
        // Proceeed with clean errors list.
        setErrorsInState(state, [])
      }
    }
  }

  function onOpenTag(tagName, attributes, state) {
    if (tagName === 'dimension') {
      state.dimension = parseSheetDimensionRef(attributes.ref)
    } else if (tagName === 'sheetData') {
      state.sheetData = createInitialStateInSheetData()
    } else if (state.sheetData) {
      onOpenTagInSheetData(tagName, attributes, state.sheetData)
    }
  }

  function onCloseTag(tagName, state) {
    if (state.sheetData) {
      onCloseTagInSheetData(tagName, state.sheetData)
    }
  }

  function onText(text, state) {
    if (state.sheetData) {
      onTextInSheetData(text, state.sheetData)
    }
  }

  /**
   * Sheet "dimension" defines the spreadsheet area containing all non-empty cells.
   * Any cells outside the "dimension" are considered empty and should be ignored.
   * https://docs.microsoft.com/en-us/dotnet/api/documentformat.openxml.spreadsheet.sheetdimension?view=openxml-2.8.1
   * @param {string} `ref` — The value of `<dimension ref/>` attribute.
   * @returns {[[number,number],[number,number]]} `undefined` or `[{ row, column }, { row, column }]` — "From row number and column number to row number and column number".
   */
  function parseSheetDimensionRef(ref) {
    let dimensions = ref.split(':').map(parseCellAddress)
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

  // Sheet Data

  function createInitialStateInSheetData() {
    return {
      c: undefined,
      rows: [],
      row: undefined,
      rowNumber: undefined,
      // How many rows have been removed from the start of `state.rows`
      // as part of `onProgress()` handler calls.
      rowIndexShift: 0,
      // Current position in the sheet.
      cursor: [0, 0],
      // Total row count.
      rowCount: 0,
      // Total column count.
      columnCount: 0,
      // Non-empty row count.
      dataRowCount: 0,
      // Non-empty column count.
      dataColumnCount: 0,
      // Cell with errors.
      errors: []
    }
  }

  function onOpenTagInSheetData(tagName, attributes, state) {
    if (tagName === 'row') {
      // Read an optional `r` attribute, which represents a 1-based row number.
      // If the `r` attribute is not present on a `<row>` then the row number is either defined by
      // `<c>` elements in it, or just assumed to be "previous row number + 1".
      if (attributes.r) {
        state.rowNumber = Number(attributes.r)
      }
      state.row = []
    } else if (tagName === 'c') {
      state.c = createInitialStateInCell()
      state.c.attributes = attributes
    } else if (state.c) {
      onOpenTagInCell(tagName, attributes, state.c)
    }
  }

  function onCloseTagInSheetData(tagName, state) {
    if (tagName === 'row') {
      // If the row number is known, check for any inter-row gaps that it might introduce.
      if (state.rowNumber) {
        // Google AI says that `<row>` elements must be ordered by row number ascending,
        // so the code assumes that there can't be an out-of-order `<row>`.
        const previousRowNumber = state.rowIndexShift + state.rows.length
        if (state.rowNumber <= previousRowNumber) {
          throw new InvalidSpreadsheetError(`Out-of-place <row/> number ${state.rowNumber} follows <row/> number ${previousRowNumber}`)
        }
        // Insert empty rows where there're gaps between the rows.
        while (state.rowNumber > state.rowIndexShift + state.rows.length + 1) {
          state.rows.push([])
        }
      }
      // Add the parsed row to the list of rows.
      state.rows.push(state.row)
      // Update the total non-empty row count.
      if (state.row.length > 0) {
        state.dataRowCount = state.rowNumber
      }
      // Update the total row count.
      if (state.rowNumber > state.rowCount) {
        state.rowCount = state.rowNumber
      }
      // Reset state.
      state.row = undefined
      state.rowNumber = undefined
    } else if (tagName === 'c') {
      const cell = parseCellFromXmlData(state.c)
      // Google AI says that the Open XML specification (ISO/IEC 29500) strictly dictates
      // that `<c>` elements within `sheet.xml` (or specifically `<sheetData>`)
      // must be written in ascending order of their `r` attributes (e.g., "A1", "B1", "C1").
      if (cell.row < state.cursor[0] || (cell.row === state.cursor[0] && cell.column <= state.cursor[1])) {
        throw new InvalidSpreadsheetError(`Out-of-place <c/> at row ${cell.row} col ${cell.column} follows <c/> at row ${state.cursor[0]} col ${state.cursor[1]}`)
      }
      // Update the cursor.
      state.cursor[0] = cell.row
      state.cursor[1] = cell.column
      // If the `r` attribute is not present on a `<row>` then the row number is either defined by
      // `<c>` elements in it, or just assumed to be "previous row number + 1".
      if (!state.rowNumber) {
        state.rowNumber = cell.row
      }
      // If the cell has an error.
      if (cell.error) {
        if (THROW_ON_FIRST_CELL_ERROR) {
          throwInvalidCellError(cell)
        }
        state.errors.push(cell)
      }
      // If the cell is not empty.
      else if (cell.value !== EMPTY_CELL_VALUE) {
        // Insert empty cells where there're gaps between the columns.
        while (cell.column > state.row.length + 1) {
          state.row.push(EMPTY_CELL_VALUE)
        }
        // Add the parsed cell value to the list of cell values in the current row.
        state.row.push(cell.value)
        // Update the total non-empty column count.
        if (cell.column > state.dataColumnCount) {
          state.dataColumnCount = cell.column
        }
      }
      // Update the total column count.
      if (cell.column > state.columnCount) {
        state.columnCount = cell.column
      }
      // Reset state.
      state.c = undefined
    } else if (state.c) {
      onCloseTagInCell(tagName, state.c)
    }
  }

  function onTextInSheetData(text, state) {
    if (state.c) {
      onTextInCell(text, state.c)
    }
  }

  /**
   * Parses the XML values of a `<c/>` element into an object representing a cell value.
   * @param {object} — `{ attributes: Record<string,string>, inlineString?: string, vText?: string }`. If `<v/>` element is present but is empty, `vText` will be an empty string. If `<v/>` element is absent, `vText` will be `undefined`.
   * @returns {object} Either `{ row: number, column: number, error: string }` or `{ row: number, column: number, value: string|number|boolean|null }`
   */
  function parseCellFromXmlData({
    attributes,
    inlineString,
    vText
  }) {
    const [row, column] = parseCellAddress(attributes.r)
    const errorOrTypeAndValue = parseCellAndTrimValue(
      attributes.t,
      attributes.s,
      vText,
      inlineString,
      parseCellParameters,
      options.trim !== false
    )
    if (typeof errorOrTypeAndValue === 'string') {
      return {
        row,
        column,
        error: errorOrTypeAndValue
        // // Report the "raw" unparsed value of the cell for potential debugging.
        // // Also report the cell type and the format in case of a numeric value.
        // //
        // // For "inline string" cells, the value should actually be the `inlineString` argument
        // // rather than `vText` argument, but the only case when it could throw an error
        // // when parsing an "inline string" cell is `VALUE_MISSING` which means that
        // // `inlineString` argument is `undefined`, same as `vText` argument in this case,
        // // so the resulting `value` property is correct anyway.
        // //
        // value: vText,
        // type: attributes.t,
        // formatId: attributes.s
      }
    }
    return {
      row,
      column,
      value: parseCellValue(errorOrTypeAndValue[1], errorOrTypeAndValue[0])
    }
  }

  // Here, it could also parse "merged cells" and then return them in some special way.
  // But then it's not clear what should be the way to return such merged cells.
  // I.e. should it just return it as a duplicate value in each one of the merged cells?
  // Or should it keep the current behavior of only returning the value of the top-most left-most cell
  // and then just return `null` for the rest of the cells in a "merged cells" group?
  // Perhaps the latter (current) approach is the most sensible one, so there's no need
  // to change anything.
  //
  // const mergedCells = getMergedCellCoordinates(sheetDocument)
  // for (const mergedCell of mergedCells) {
  //   const [from, to] = mergedCell.split(':').map(parseCellAddress)
  //   console.log('Merged Cell.', 'From:', from, 'To:', to)
  // }

  // Cell

/**
 * Parses a cell from the info extracted from the cell XML.
 * If the cell is of type string, it trims the value (by default).
 *
 * Receives same arguments as `parseCell()` function, with an additional argument
 * `trimStrings: boolean` which tells if it should trim any string values.
 *
 * Produces same result as `parseCell()` function, except for cells of type "e".
 */
  function parseCellAndTrimValue(
    t,
    s,
    v,
    inlineString,
    parameters,
    trimStrings
  ) {
    // Parse cell value from cell XML.
    const errorOrTypeAndValue = parseCellWithRepairAbility(
      t,
      s,
      v,
      inlineString,
      parameters
    )
    // Trim any text cell values (by default)
    if (Array.isArray(errorOrTypeAndValue) && errorOrTypeAndValue[0] === 's') {
      // A developer could optionally disable the automatic trimming of all strings.
      // For example, leading spaces might express a tree-like hierarchy, in which case they should be preserved.
      // https://github.com/catamphetamine/read-excel-file/pull/106#issuecomment-1136062917
      if (trimStrings) {
        errorOrTypeAndValue[1] = errorOrTypeAndValue[1].trim()
      }
      // Convert empty strings to `null`
      if (errorOrTypeAndValue[1] === '') {
        return EMPTY_CELL
      }
    }
    // Return the cell's type and value.
    return errorOrTypeAndValue
  }

  /**
   * Parses cell value and optionally repairs any repairable errors.
   * Receives same arguments as `parseCell()` function.
   * Produces same result as `parseCell()` function, except for cells of type "e".
   */
  function parseCellWithRepairAbility(t, s, v, inlineString, parameters) {
    // Parse cell value from cell XML.
    const errorOrTypeAndValue = parseCell(
      t,
      s,
      v,
      inlineString,
      parameters
    )
    // If the cell value was expected but is missing,
    // it is considered a repairable situation.
    if (errorOrTypeAndValue === 'VALUE_MISSING') {
      // The default cell type is "n" (numeric), according to XLSX specification.
      switch (t || 'n') {
        // * If the cell is defined by a formula.
        // * Or contains an inline string.
        // * Or contains a shared string.
        // * Or contains a boolean value.
        case 'str':
        case 'inlineStr':
        case 's':
        case 'b':
          // * If the formula result is not pre-computed (which is allowed by the spec)
          // then just ignore this cell.
          // * If the inline string value is not specified then just ignore this cell.
          // * If the shared string index is not specified then just ignore this cell.
          // * If the boolean value is not specified then just ignore this cell.
          return EMPTY_CELL
      }
    }
    // If the cell contains a formula that couldn't be calculated due to an error,
    // simply ignore such cell and assume it to be empty.
    if (t === 'e') {
      return EMPTY_CELL
    }
    // Return either the error code or the cell's type and value.
    return errorOrTypeAndValue
  }

  /**
   * For certain types of cell, it transforms the value.
   * Specifically, for cells of type "n" or "d", it transforms the value to `Number` or `Date` respectively.
   *
   * The reason it is done separately is because before this function is called,
   * the cells are easily "serializable". And after this function is called,
   * some of the cells' `value` properties become instances of `Date` class or any other class,
   * such as `BigInt`, serializing which would require additional manual steps to be performed.
   * Serializing cells could be utilized in case of "transferring" data between workers
   * with a `transferList`, argument which could hypothetically result in better performance
   * and less time being blocked by the "synchronous" JSON serialization.
   *
   * @param {string|number|boolean|null} value
   * @param {string} type — One of: "s", "n", "d", "b", "-"
   * @return {string|ParsedNumber|Date|boolean|null}
   */
  function parseCellValue(value, type) {
    if (type === 'n') {
      // Parse number from string.
      // Supports custom parsing function to work around the javascript number precision limitation.
      // https://gitlab.com/catamphetamine/read-excel-file/-/issues/85
      if (options.parseNumber) {
        return options.parseNumber(value)
      }
      return value
    } else if (type === 'd') {
      return new Date(value)
    } else {
      return value
    }
  }

  function createInitialStateInCell() {
    return {
      v: false,
      is: false,
      t: false,
      r: false,
      rPh: false,
      vText: undefined,
      inlineString: undefined,
      attributes: undefined
    }
  }

  function onOpenTagInCell(tagName, attributes, state) {
    if (tagName === 'v') {
      state.v = true
    } else if (tagName === 'is') {
      // The possible children of <is> are:
      // * <t> (Text): The standard child to hold plain, simple text.
      // * <r> (Rich Text Run): Used for applying different formatting styles (like bold or italic) to specific segments of text within a single cell.
      // * <rPh> (Phonetic Run): Used primarily for East Asian languages to provide phonetic reading/pronunciation data (e.g., furigana in Japanese). It associates a phonetic pronunciation run right alongside the base string text tag <t>.
      // * <phoneticPr> (Phonetic Properties): Defines formatting and settings for the phonetic text.
      state.is = true
      state.inlineString = ''
    } else if (tagName === 't') {
      state.t = true
    } else if (tagName === 'r') {
      // The possible children of <r/> are:
      // * <rPr> (Run Properties): The formatting properties for the text (font, size, color, bold, italic, etc.).
      // * <t> (Text): The actual text payload.
      // * <rPh> (Phonetic Run): Phonetic pronunciation guidance (used for East Asian languages like Japanese). It associates a phonetic pronunciation run right alongside the base string text tag <t>.
      state.r = true
    } else if (tagName === 'rPh') {
      // The possible children of <rPh/> are:
      // * <t> (Text):  Contains the actual phonetic text or reading (usually in Katakana for Japanese) that corresponds to the associated character string.
      state.rPh = true
    }
  }

  function onCloseTagInCell(tagName, state) {
    if (tagName === 'v') {
      state.v = false
      // If the `<v/>` element is present but is empty,
      // reassign `vText` property from `undefined` to an empty string `""`.
      // This is to differentiate between two separate cases:
      // * When `<f/>` formula is present but its result is not pre-computed (`<v/>` is absent)
      // * When `<f/>` formula is present and its result is an empty string (`<v/>` is present but empty)
      state.vText ||= ''
    } else if (tagName === 'is') {
      state.is = false
    } else if (tagName === 't') {
      state.t = false
    } else if (tagName === 'r') {
      state.r = false
    } else if (tagName === 'rPh') {
      state.rPh = false
    }
  }

  function onTextInCell(text, state) {
    if (state.v) {
      state.vText = text
    } else if (state.is) {
      if (state.rPh) {
        // Ignore anything inside `<rPh/>` tags
      } else if (state.t) {
        if (state.r) {
          // An `<r/>` element could contain multiple `<t/>` elements,
          // the text content from all of which should be concatenated.
          state.inlineString += text
        } else {
          state.inlineString = text
        }
      }
    }
  }

  // Dimensions

  function getSheetDimensions(cells) {
    // The left-top boundary is ignored and is always assumed to be `0, 0`.
    // It used to be not ignored in the past but that produced confusing behavior
    // when empty rows or columns at the start of a sheet were discarded,
    // and that was not something that users of this package expected.
    // https://github.com/catamphetamine/read-excel-file/issues/102#issuecomment-973238655
    let minRow = cells.length === 0 ? 0 : 1
    let minCol = cells.length === 0 ? 0 : 1

    let maxRow = 0
    let maxCol = 0

    for (const cell of cells) {
      if (maxRow < cell.row) {
        maxRow = cell.row
      }
      if (maxCol < cell.column) {
        maxCol = cell.column
      }
    }

    return [
      [minRow, minCol],
      [maxRow, maxCol]
    ]
  }
}
