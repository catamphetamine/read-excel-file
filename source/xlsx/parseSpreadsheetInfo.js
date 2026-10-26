/**
 * Parses spreadsheet info.
 * @param {string} content
 * @param  {function} parseXml — SAX XML parser.
 * @returns {object} An object of shape `{ epoch1904: boolean, sheets: Sheet[] }`.
 */
export default function parseSpreadsheetInfo(content, parseXml) {
  const state = createInitialState()
  return parseXml(
    content,
    state,
    onOpenTag,
    null,
    null
  ).then(() => getResultFromState(state))

  function createInitialState() {
    return {
      workbookPr: undefined,
      sheets: []
    }
  }

  function getResultFromState(state) {
    return {
      epoch1904: state.workbookPr ? state.workbookPr.epoch1904 : false,
      sheets: state.sheets
    }
  }

  function onOpenTag(tagName, attributes, state) {
    if (tagName === 'workbookPr') {
      // The official Open XML specification dictates that the top-level `<workbook/>` element
      // should only contain exactly one `<workbookPr/>` element. In case of multiple ones,
      // only the first one is being read and the rest are simply ignored.
      //
      // There's a `1904-based-dates.xlsx` test case that happens to include multiple `<workbookPr/>`
      // elements by accident, most likely because I edited its `.xml` files by hand and didn't notice
      // the already-existing `<workbookPr/>` tag.
      //
      // At first I thought about just fixing that one `.xlsx` test file but later
      // I saw that another library called `SheetJS` specifically handles such cases
      // by only reading the first `<workbookPr/>` element and ignoring the rest,
      // so I though that perhaps it would make some sense to do same thing here.
      // https://github.com/SheetJS/sheetjs/issues/1619
      //
      if (!state.workbookPr) {
        // Read `<workbookPr/>` element attributes to detect whether dates are 1900-based or 1904-based.
        // https://support.microsoft.com/en-gb/help/214330/differences-between-the-1900-and-the-1904-date-system-in-excel
        // http://webapp.docx4java.org/OnlineDemo/ecma376/SpreadsheetML/workbookPr.html
        // `date1904` is an `xsd:boolean`, so both `"1"` and `"true"` mean `true`.
        // https://www.w3.org/TR/xmlschema-2/#boolean
        state.workbookPr = {
          epoch1904: attributes.date1904 === '1' || attributes.date1904 === 'true'
        }
      }
    } else if (tagName === 'sheet') {
      // Example of `<sheets/>` element:
      // ```
      // <sheets>
      //   <sheet
      //     xmlns:ns="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
      //     name="Sheet1"
      //     sheetId="1"
      //     ns:id="rId3"/>
      // </sheets>
      // ```
      if (attributes.name) {
        state.sheets.push({
          // `sheetId` attribute value is an arbitrary, `1`-based unique positive integer
          // assigned to a worksheet, typically starting at `1` for the first sheet.
          //  Deleting and adding new sheets might cause the sheetId values to become non-sequential.
          // For example, `sheetId`s could be `1`, `2`, `4`, if sheet `3` was deleted.
          id: Number(attributes.sheetId),
          name: attributes.name,
          relationId: attributes.id
        })
      }
    }
  }
}