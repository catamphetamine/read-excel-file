/**
 * Parses `.xlsx` file styles.
 * http://officeopenxml.com/SSstyles.php
 * Returns an array of cell styles.
 * A cell style index is the cell style ID.
 * @param {string} content
 * @param  {function} parseXmlStream — SAX XML parser.
 * @returns {object} styles
 */
export default function parseStyles(content, parseXmlStream) {
  // https://social.msdn.microsoft.com/Forums/sqlserver/en-US/708978af-b598-45c4-a598-d3518a5a09f0/howwhen-is-cellstylexfs-vs-cellxfs-applied-to-a-cell?forum=os_binaryfile
  // https://www.office-forums.com/threads/cellxfs-cellstylexfs.2163519/
  return parseXmlStream(content, {
    createInitialState: createInitialStateInStyles,
    onOpenTag: onOpenTagInStyles,
    onCloseTag: onCloseTagInStyles
  }).then((state) => {
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
  })
}

function createInitialStateInStyles() {
  return {
    numberFormats: {},
    baseStyles: [],
    // The first `164` elements of the `styles` array are going to be `undefined`
    // because those represent the built-in "default" styles in `.xlsx` specification.
    // These "default" styles have IDs from `0` to `163`, i.e. according to their index.
    styles: [],
    cellStyleXfs: false,
    cellXfs: false
  }
}

function onOpenTagInStyles(tagName, attributes, state) {
  if (tagName === 'numFmt') {
    // `<numFmts/>` element contains `<numFmt/>` elements.
    // `<numFmt/>` defines a "number format" template.
    // The value of `numFmtId` attribute is a (numeric) ID of this "number format".
    state.numberFormats[attributes.numFmtId] = {
      id: Number(attributes.numFmtId),
      template: attributes.formatCode
    }
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

function onCloseTagInStyles(tagName, state) {
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
  const { numFmtId } = attributes
  if (numFmtId) {
    // Built-in number formats don't have a `<numFmt/>` element in `styles.xml`.
    // https://hexdocs.pm/xlsxir/number_styles.html
    if (numberFormats && numberFormats[numFmtId]) {
      // Non-built-in number format.
      style.numberFormat = numberFormats[numFmtId]
    } else {
      // Built-in number format.
      style.numberFormat = { id: Number(numFmtId) }
    }
  }
  return style
}