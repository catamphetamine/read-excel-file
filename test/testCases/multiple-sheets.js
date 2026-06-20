export default async function({ readSheetFromFile, readSheetsFromFile, expect }) {
	// should read sheet by name (first)
	const dataSheet1 = await readSheetFromFile('sheet 1')
	expect(dataSheet1.length).to.equal(1)
	expect(dataSheet1[0][0]).to.equal('First sheet')

	// should read sheet by name (second)
	const dataSheet2 = await readSheetFromFile('sheet 2')
	expect(dataSheet2.length).to.equal(1)
	expect(dataSheet2[0][0]).to.equal('Second sheet')

	// should read sheet by index (first) (default)
	const dataDefault = await readSheetFromFile()
	expect(dataDefault.length).to.equal(1)
	expect(dataDefault[0][0]).to.equal('First sheet')

	// should read sheet by index (first)
	const data1 = await readSheetFromFile(1)
	expect(data1.length).to.equal(1)
	expect(data1[0][0]).to.equal('First sheet')

	// should read sheet by name (second)
	const data2 = await readSheetFromFile(2)
	expect(data2.length).to.equal(1)
	expect(data2[0][0]).to.equal('Second sheet')

	// should read all sheets
	const dataAllSheets = await readSheetsFromFile()
	expect(dataAllSheets).to.deep.equal([
		{
			sheet: 'sheet 1',
			data: [['First sheet']]
		},
		{
			sheet: 'sheet 2',
			data: [['Second sheet']]
		}
	])
}