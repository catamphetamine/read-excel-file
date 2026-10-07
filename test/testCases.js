export default [
	{
		name: 'trim',
		description: 'should allow control of value trimming'
	},
	{
		name: '1904-based-dates',
		description: 'should parse 1904-based macOS dates'
	},
	{
		name: 'boolean',
		description: 'should parse booleans'
	},
	{
		name: 'date',
		description: 'should parse dates'
	},
	{
		name: 'inline-string',
		description: 'should parse inline strings'
	},
	{
		name: 'made-in-macos-excel-2011',
		description: 'should read basic file'
	},
	{
		name: 'made-in-macos-excel-2011-with-custom-font',
		description: 'should read a file that was create in MacOS Excel 2011 (with custom font)'
	},
	{
		name: 'color-styles-and-utf8-sheet-name',
		description: 'should read a file with color styles and UTF-8 sheet name'
	},
	{
		name: 'merged-cells',
		description: 'should read merged cells'
	},
	{
		name: 'multiple-sheets',
		description: 'should read multiple sheets'
	},
	{
		name: 'non-ascii-character-encoding',
		description: 'should correctly read non-ASCII characters'
	},
	{
		name: 'custom-number-parser',
		description: 'should support custom `parseNumber` function'
	},
	{
		name: 'dimensions-absent',
		description: 'should read the entire sheet when dimensions aren\'t specified'
	},
	{
		name: 'large-metadata-before-sheet-data',
		description: 'should read a sheet when its metadata spans multiple XML parsing chunks'
	},
	{
		name: 'read-sheet',
		description: 'should read a single sheet'
	},
	{
		name: 'schema',
		description: 'should parse objects from sheet data when `schema` parameter is passed'
	},
	{
		name: 'advanced-shared-strings',
		description: 'should skip "phonetic" elements `<rPh/>` and handle "rich formatting" `<rPr/>` elements when parsing `sharedStrings.xml`'
	},
	{
		name: 'formula',
		description: 'should read pre-computed results of formulas'
	},
	{
		name: 'error-in-cell',
		description: 'should read a sheet that has a cell with an error'
	},
	{
		name: 'gaps',
		description: 'should read a sheet that has gaps in rows and columns'
	},
	{
		name: 'xml-namespace',
		description: 'should correctly parse XML namespaces'
	},
	{
		name: 'internal-file-missing',
		description: 'should handle when `workbook.xml` file is not present in the archive'
	},
	{
		name: 'repairable-spreadsheet',
		description: 'should repair an `.xlsx` file having sloppy mistakes in `.xml` files content'
	},
	{
		name: 'strict',
		description: 'should read Strict OpenXML `.xlsx` format'
	}
]
