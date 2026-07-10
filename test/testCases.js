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
		name: 'dimensions',
		description: 'should only read the area of specified dimensions from a sheet'
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
		name: 'string-formula',
		description: 'should return `<v/>` element content when a `type: string` cell is defined by a formula'
	},
	{
		name: 'xml-namespace',
		description: 'should correctly parse XML namespaces'
	},
	{
		name: 'invalid-file-structure',
		description: '`workbook.xml` file is not present in the archive'
	}
]