export default async function({ readSheetFromFile, expect }) {
	const data = await readSheetFromFile({ trim: false })

	expect(data).to.deep.equal([
		['One', 'Two'],
		['Three', 'Four']
	])
}