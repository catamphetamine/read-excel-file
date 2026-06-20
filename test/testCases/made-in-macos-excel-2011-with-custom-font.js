export default async function({ readSheetFromFile, expect }) {
	const data = await readSheetFromFile({ trim: false })

	expect(data).to.deep.equal([
		['Hey', 'now', 'so'],
		['cool', null, null]
	])
}