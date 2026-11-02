/**
 * Parses `.xlsx` file styles.
 * http://officeopenxml.com/SSstyles.php
 * Returns an array of cell styles.
 * A cell style index is the cell style ID.
 * @param {string} content
 * @param  {function} parseXml — SAX XML parser.
 * @returns {object} styles
 */
export default function parseStyles(content, parseXml) {
  // https://social.msdn.microsoft.com/Forums/sqlserver/en-US/708978af-b598-45c4-a598-d3518a5a09f0/howwhen-is-cellstylexfs-vs-cellxfs-applied-to-a-cell?forum=os_binaryfile
  // https://www.office-forums.com/threads/cellxfs-cellstylexfs.2163519/
  const state = createInitialState()
  return parseXml(
    content,
    state,
    onOpenTag,
    onCloseTag,
    null
  ).then(() => getResultFromState(state))

  function createInitialState() {
    return {
      numberFormats: [],
      baseStyles: [],
      // The first `164` elements of the `styles` array are going to be `undefined`
      // because those represent the built-in "default" styles in `.xlsx` specification.
      // These "default" styles have IDs from `0` to `163`, i.e. according to their index.
      styles: [],
      cellStyleXfs: false,
      cellXfs: false
    }
  }

  function getResultFromState(state) {
    return state.styles.map((style) => {
      if (style.xfId) {
        const { xfId, ...styleProperties } = style
        return {
          ...state.baseStyles[xfId],
          ...styleProperties
        }
      } else {
        return style
      }
    })
  }

  function onOpenTag(tagName, attributes, state) {
    if (tagName === 'numFmt') {
      // `<numFmts/>` element contains `<numFmt/>` elements.
      // `<numFmt/>` defines a "number format" template.
      // The value of `numFmtId` attribute is a (numeric) ID of this "number format".
      const numFmtId = Number(attributes.numFmtId)
      const numberFormat = { id: numFmtId }
      //
      // If (and only if) `numFmtId` is >= 164, it is supposed to specify a `formatCode` (a template).
      //
      // For some reason, Microsoft Excel 2007 doesn't allow to redefine `numFmtId="99"`
      // but at the same time does allow redefining `numFmtId="100"`.
      //
      // Google AI says:
      //
      // "Standard built-in Excel formats use IDs from 0 to 49 (and some regional ones up to 81).
      //  IDs 164 and above are officially reserved for custom formats, but third-party spreadsheet
      //  generators or older templates frequently assign custom IDs starting at 100 (or lower)"
      //
      // Because of such "non-strict" behavior of Microsoft Excel 2007 regarding overwriting
      // number formats with ID >= 100, this package mimicks such "non-strict" approach.
      //
      if (numFmtId >= 100) {
        numberFormat.template = attributes.formatCode
      }
      state.numberFormats[numFmtId] = numberFormat
    } else if (tagName === 'cellStyleXfs') {
      // `<cellStyleXfs/>` contains "base styles" that could be extended by `<cellXfs/>`.
      // These styles don't apply to individual cells directly. They can only be extended.
      state.cellStyleXfs = true
    } else if (tagName === 'cellXfs') {
      // `<cellXfs/>` contains individual cell styles. They can extend "base styles".
      state.cellXfs = true
    } else if (tagName === 'xf') {
      if (state.cellStyleXfs) {
        // The index of a `<xf/>` element is by definition its numeric ID.
        // Therefore, even empty `style` elements still must be put into the array.
        state.baseStyles.push(parseCellStyle(attributes))
      } else if (state.cellXfs) {
        const style = parseCellStyle(attributes, state.numberFormats)
        // A style might extend a "base style" by its numeric ID.
        if (attributes.xfId) {
          style.xfId = Number(attributes.xfId)
        }
        // The index of a `<xf/>` element is by definition its numeric ID.
        // Therefore, even empty `style` elements still must be put into the array.
        state.styles.push(style)
      }
    }
  }

  function onCloseTag(tagName, state) {
    if (tagName === 'cellStyleXfs') {
      state.cellStyleXfs = false
    } else if (tagName === 'cellXfs') {
      state.cellXfs = false
    }
  }

  function parseCellStyle(attributes, numberFormats) {
    const style = {}
    // `numFmtId` in `<cellStyleXfs/>` and `<cellXfs/>` is a numerical ID
    // referencing the cell's "number format". Values from `0` to `163` are built-in formats,
    // while values `164` and above are custom formats defined in the `<numFmts/>` element.
    if (attributes.numFmtId) {
      const numFmtId = Number(attributes.numFmtId)
      // Built-in number formats don't have a `<numFmt/>` element in `styles.xml`.
      // https://hexdocs.pm/xlsxir/number_styles.html
      if (numberFormats && numberFormats[numFmtId]) {
        // Non-built-in number format.
        style.numberFormat = numberFormats[numFmtId]
      } else {
        // Built-in number format.
        style.numberFormat = { id: numFmtId }
      }
    }
    return style
  }
}