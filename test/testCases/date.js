export default async function({ readSheetFromFile, expect }) {
	const data = await readSheetFromFile()

	expect(data).to.deep.equal([
		// ['Date'],
		[new Date('2021-06-10T00:47:45.700Z')]
	])
}