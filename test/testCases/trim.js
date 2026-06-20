export default async function({ readSheetFromFile, expect }) {
	const dataNonTrimmed = await readSheetFromFile({ trim: false })
	expect(dataNonTrimmed).to.deep.equal([
		[' text ']
	])

	const dataTrimmed = await readSheetFromFile()
	expect(dataTrimmed).to.deep.equal([
		['text']
	])
}