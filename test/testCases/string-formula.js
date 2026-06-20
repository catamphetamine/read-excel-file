export default async function({ readSheetFromFile, expect }) {
	const data = await readSheetFromFile()

	expect(data.length).to.equal(7)
	expect(data[4][2]).to.equal('Value2')
	expect(data[4][3]).to.equal('Value3')
	// The empty row with index `5` is preserved.
	expect(data[6][1]).to.equal('Value2Value3')
	// Just a check for numeric formula <v/>alue.
	expect(data[6][2]).to.equal(0.909297426825682)
}