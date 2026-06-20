import {
  getBaseStyles,
  getCellStyles,
  getNumberFormats
} from '../xml/xlsx.js'

/**
 * Parses `.xlsx` file styles.
 * http://officeopenxml.com/SSstyles.php
 * Returns an array of cell styles.
 * A cell style index is the cell style ID.
 * @param {string} content
 * @param  {function} parseXmlTree — Parses an XML string into a DOM tree.
 * @returns {object} styles
 */
export default function parseStyles(content, parseXmlTree) {
  // https://social.msdn.microsoft.com/Forums/sqlserver/en-US/708978af-b598-45c4-a598-d3518a5a09f0/howwhen-is-cellstylexfs-vs-cellxfs-applied-to-a-cell?forum=os_binaryfile
  // https://www.office-forums.com/threads/cellxfs-cellstylexfs.2163519/
  const document = parseXmlTree(content)

  const baseStyles = getBaseStyles(document)
    .map(parseCellStyle)

  const numberFormats = getNumberFormats(document)
    .map(parseNumberFormatStyle)
    .reduce((formats, format) => {
      // Format ID is a numeric index.
      // There're some standard "built-in" formats (in Excel) up to about `100`.
      formats[format.id] = format
      return formats
    }, [])

  const getCellStyle = (xf) => {
    if (xf.hasAttribute('xfId')) {
      return {
        ...baseStyles[xf.xfId],
        ...parseCellStyle(xf, numberFormats)
      }
    }
    return parseCellStyle(xf, numberFormats)
  }

  return getCellStyles(document).map(getCellStyle)
}

function parseNumberFormatStyle(numFmt) {
  return {
    id: numFmt.getAttribute('numFmtId'),
    template: numFmt.getAttribute('formatCode')
  }
}

// http://www.datypic.com/sc/ooxml/e-ssml_xf-2.html
function parseCellStyle(xf, numFmts) {
  const style = {}
  if (xf.hasAttribute('numFmtId')) {
    const numberFormatId = xf.getAttribute('numFmtId')
    // Built-in number formats don't have a `<numFmt/>` element in `styles.xml`.
    // https://hexdocs.pm/xlsxir/number_styles.html
    if (numFmts[numberFormatId]) {
      style.numberFormat = numFmts[numberFormatId]
    } else {
      style.numberFormat = { id: numberFormatId }
    }
  }
  return style
}