export default async function({ readSheetFromFile, expect }) {
	// Without an explicit sheet number or name.
	await readSheetFromFile()

	// With an explicit sheet number.
	await readSheetFromFile(1)

	// With an explicit sheet name.
	await readSheetFromFile('Sheet1')

	// should read a single sheet when options are passed.
	// without an explicit sheet number or name.
	await readSheetFromFile({ trim: false })

	// should throw an error when sheet is not found.
	// read sheet by id.
	try {
		await readSheetFromFile(2)
	} catch (error) {
		expect(error.message).to.equal('Sheet number out of bounds: 2. Available sheets count: 1')
	}

	// should throw an error when sheet is not found.
	// read sheet by name.
	try {
		await readSheetFromFile('Sheet2')
	} catch (error) {
		expect(error.message).to.equal('Sheet "Sheet2" not found. Available sheets: "Sheet1"')
	}
}