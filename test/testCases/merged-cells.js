export default async function({ readSheetFromFile, expect }) {
	const data = await readSheetFromFile()

	expect(data).to.deep.equal([
		['A1', 'B1', 'C1', 'D1'],
		['A2', 'B2', 'C2', 'D2']
	])
}