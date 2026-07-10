/**
 * Returns sheet file paths.
 * Seems that the correct place to look for the `sheetId` -> `filename` mapping
 * is `xl/_rels/workbook.xml.rels` file.
 * https://github.com/tidyverse/readxl/issues/104
 * @param  {string} content — `xl/_rels/workbook.xml.rels` file contents.
 * @param  {function} parseXmlStream — SAX XML parser.
 * @return {object} — An object of shape `{ sheets: Record<string, string>, sharedStrings: string?, styles: string? }`
 */
export default function parseFilePaths(content, parseXmlStream) {
  // Example:
  // <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  //   ...
  //   <Relationship
  //     Id="rId3"
  //     Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet"
  //     Target="worksheets/sheet1.xml"/>
  // </Relationships>
  return parseXmlStream(content, {
    createInitialState: createInitialStateInWorkbookRelationships,
    onOpenTag: onOpenTagInWorkbookRelationships
  }).then((state) => {
    return state
  })
}

function createInitialStateInWorkbookRelationships() {
  return {
    sheets: {},
    sharedStrings: undefined,
    styles: undefined
  }
}

function onOpenTagInWorkbookRelationships(tagName, attributes, state) {
  if (tagName === 'Relationship') {
    addFilePathForRelation(state, attributes.Id, attributes.Type, attributes.Target)
  }
}

function addFilePathForRelation(state, id, type, target) {
  switch (type) {
    case 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles':
      state.styles = getFilePathFromRelationTarget(target)
      break
    case 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings':
      state.sharedStrings = getFilePathFromRelationTarget(target)
      break
    case 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet':
      state.sheets[id] = getFilePathFromRelationTarget(target)
      break
  }
}

function getFilePathFromRelationTarget(path) {
  // Normally, `path` is a relative path inside the ZIP archive,
  // like "worksheets/sheet1.xml", or "sharedStrings.xml", or "styles.xml".
  // There has been one weird case when file path was an absolute path,
  // like "/xl/worksheets/sheet1.xml" (specifically for sheets):
  // https://github.com/catamphetamine/read-excel-file/pull/95
  // Other libraries (like `xlsx`) and software (like Google Docs)
  // seem to support such absolute file paths, so this library does too.
  if (path[0] === '/') {
    return path.slice('/'.length)
  }
  // // Seems like a path could also be a URL.
  // // http://officeopenxml.com/anatomyofOOXML-xlsx.php
  // if (/^[a-z]+\:\/\//.test(path)) {
  //   return path
  // }
  return 'xl/' + path
}
