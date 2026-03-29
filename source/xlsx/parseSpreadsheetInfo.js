import {
  getWorkbookProperties,
  getSheets
} from '../xml/xlsx.js'

// I guess `xl/workbook.xml` file should always be present inside the *.xlsx archive.
export default function parseSpreadsheetInfo(content, xml) {
  const book = xml.createDocument(content)

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