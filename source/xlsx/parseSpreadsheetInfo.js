import {
  getWorkbookProperties,
  getSheets
} from '../xml/xlsx.js'

/**
 * Parses spreadsheet info.
 * @param {string} content
 * @param  {function} parseXmlTree — Parses an XML string into a DOM tree.
 * @returns {object} An object of shape `{ epoch1904: boolean, sheets: Sheet[] }`.
 */
export default function parseSpreadsheetInfo(content, parseXmlTree) {
  const book = parseXmlTree(content)

  // Read `<workbookPr/>` element to detect whether dates are 1900-based or 1904-based.
  // https://support.microsoft.com/en-gb/help/214330/differences-between-the-1900-and-the-1904-date-system-in-excel
  // http://webapp.docx4java.org/OnlineDemo/ecma376/SpreadsheetML/workbookPr.html
  const workbookProperties = getWorkbookProperties(book)
  const epoch1904 = Boolean(workbookProperties) && workbookProperties.getAttribute('date1904') === '1'

  // Example of `<sheets/>` element:
  //
  // <sheets>
  //   <sheet
  //     xmlns:ns="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  //     name="Sheet1"
  //     sheetId="1"
  //     ns:id="rId3"/>
  // </sheets>

  const sheets = []
  for (const sheet of getSheets(book)) {
    if (sheet.getAttribute('name')) {
      sheets.push({
        id: sheet.getAttribute('sheetId'),
        name: sheet.getAttribute('name'),
        relationId: sheet.getAttribute('r:id')
      })
    }
  }

  return {
    epoch1904,
    sheets
  }
}