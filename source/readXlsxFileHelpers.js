export function getXlsxEntryKey(entryPath, sheet) {
  switch (entryPath) {
    case `xl/worksheets/sheet${sheet}.xml`:
      return 'sheet';
    case 'xl/sharedStrings.xml':
      return 'strings';
  }
}

export function validateXlsxEntries(entries, sheet) {
	if (!entries.sheet) {
		throw new Error(`Sheet "${sheet}" not found in *.xlsx file.`)
	}
	return entries
}