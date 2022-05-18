import {
  getBaseStyles,
  getCellStyles,
  getNumberFormats
} from '../xml/xlsx.js'

// http://officeopenxml.com/SSstyles.php
// Returns an array of cell styles.
// A cell style index is its ID.
export default function parseStyles(content, xml) {
  if (!content) {
    return {}
  }

  // https://social.msdn.microsoft.com/Forums/sqlserver/en-US/708978af-b598-45c4-a598-d3518a5a09f0/howwhen-is-cellstylexfs-vs-cellxfs-applied-to-a-cell?forum=os_binaryfile
  // https://www.office-forums.com/threads/cellxfs-cellstylexfs.2163519/
  const doc = xml.createDocument(content)

  const baseStyles = getBaseStyles(doc)
    .map(parseCellStyle)

  const numberFormats = getNumberFormats(doc)
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

  return getCellStyles(doc).map(getCellStyle)
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