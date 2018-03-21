export function getXlsxEntryKey(entryPath, sheet) {
  switch (entryPath) {
    case `xl/worksheets/sheet${sheet}.xml`:
      return 'sheet';
    case 'xl/sharedStrings.xml':
      return 'strings';
  }
}