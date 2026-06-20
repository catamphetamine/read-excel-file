export default async function({ readSheetFromFile, expect }) {
	// When parsing `<si>...</si>` elements in `sharedStrings.xml`,
	// it should ingore "phonetic" `<rPh/>` elements because those aren't meant to be seen.
	// https://github.com/doy/spreadsheet-parsexlsx/issues/72
	const data = await readSheetFromFile()

	expect(data).to.deep.equal([
		['Str']
	])
}