// https://gitlab.com/catamphetamine/read-excel-file/-/issues/25
export default async function({ readSheetFromFile, expect }) {
	const data = await readSheetFromFile()
	expect(data[0][0]).to.equal('Phrase')
}