export default async function({ readSheetFromFile, expect }) {
	const data = await readSheetFromFile()

	expect(data).to.deep.equal([
		['Boolean'],
		[true],
		[false],
		[1],
		[0]
	])
}