// Turns out IE11 doesn't support XPath, so not using `./xpathBrowser` for browsers.
// https://github.com/catamphetamine/read-excel-file/issues/26
// The inclusion of `xpath` package in `./xpathNode`
// increases the bundle size by about 100 kilobytes.
// IE11 is a wide-spread browser and it's unlikely that
// anyone would ignore it for now.
// There could be a separate export `read-excel-file/ie11`
// for using `./xpathNode` instead of `./xpathBrowser`
// but this library has been migrated to not using `xpath` anyway.
// This code is just alternative/historical now, it seems.
import xpath from './xpathNode'

const namespaces = {
  a: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
  // This one seems to be for `r:id` attributes on `<sheet>`s.
  r: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
  // This one seems to be for `<Relationships/>` file.
  rr: 'http://schemas.openxmlformats.org/package/2006/relationships'
}

export function getCells(document) {
  return xpath(document, null, '/a:worksheet/a:sheetData/a:row/a:c', namespaces)
}

export function getCellValue(document, node) {
  return xpath(document, node, './a:v', namespaces)[0]
}

export function getDimensions(document) {
  const dimensions = xpath(document, null, '/a:worksheet/a:dimension/@ref', namespaces)[0]
  if (dimensions) {
    return dimensions.textContent
  }
}

export function getBaseStyles(document) {
  return xpath(document, null, '/a:styleSheet/a:cellStyleXfs/a:xf', namespaces)
}

export function getCellStyles(document) {
  return xpath(document, null, '/a:styleSheet/a:cellXfs/a:xf', namespaces)
}

export function getNumberFormats(document) {
  return xpath(document, null, '/a:styleSheet/a:numFmts/a:numFmt', namespaces)
}

export function getSharedStrings(document) {
	// An `<si/>` element can contain a `<t/>` (simplest case) or a set of `<r/>` ("rich formatting") elements having `<t/>`.
	// https://docs.microsoft.com/en-us/dotnet/api/documentformat.openxml.spreadsheet.sharedstringitem?redirectedfrom=MSDN&view=openxml-2.8.1
	// http://www.datypic.com/sc/ooxml/e-ssml_si-1.html

  // The ".//a:t[not(ancestor::a:rPh)]" selector means:
  // "select all `<t/>` that are not children of `<rPh/>`". 
	// https://stackoverflow.com/questions/42773772/xpath-span-what-does-the-dot-mean
  // `<rPh><t></t></rPh>` seems to be some "phonetic data" added for languages like Japanese that should be ignored.
  // https://github.com/doy/spreadsheet-parsexlsx/issues/72
  return xpath(document, null, '/a:sst/a:si', namespaces)
    .map(string => xpath(document, string, './/a:t[not(ancestor::a:rPh)]', namespaces)
        .map(_ => _.textContent).join('')
    )
}

export function getWorkbookProperties(document) {
  return xpath(document, null, '/a:workbook/a:workbookPr', namespaces)[0]
}

export function getRelationships(document) {
  return xpath(document, null, '/rr:Relationships/rr:Relationship', namespaces)
}

export function getSheets(document) {
  return xpath(document, null, '/a:workbook/a:sheets/a:sheet', namespaces)
}