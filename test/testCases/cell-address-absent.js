export default async function({ readSheetFromFile, expect }) {
	const data = await readSheetFromFile()

	expect(data).to.deep.equal([
		['A1', 'B1', 'C1'],
		[1, null, 3],
		['A3', 'B3', null]
	])
}
