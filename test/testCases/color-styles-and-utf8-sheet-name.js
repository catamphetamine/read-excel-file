export default async function({ readSheetFromFile, expect }) {
	const data = await readSheetFromFile({ trim: false })

	expect(data).to.deep.equal([
		['id', 'memo'],
		[1, 'abc def ghi '],
		[2, 'pqr stu']
	])
}