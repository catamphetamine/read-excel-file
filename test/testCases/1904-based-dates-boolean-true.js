export default async function({ readSheetFromFile, expect }) {
	// `<workbookPr date1904="true"/>`: `date1904` is an `xsd:boolean`, so `true` is the same as `1`.
	// The only cell holds serial date `45000` which is `2023-03-15` in a 1900-based file
	// and `2027-03-16` in a 1904-based one.
	const data = await readSheetFromFile()

	expect(data.length).to.equal(1)
	expect(data[0][0].toISOString()).to.equal('2027-03-16T00:00:00.000Z')
}