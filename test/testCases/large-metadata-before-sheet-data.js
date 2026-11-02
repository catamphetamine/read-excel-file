// This test case checks the correctness of `onProgress()` function
// when parsing `sheet{id}.xml` files inside an `.xlsx` file.
// The `onProgress()` function parses `sheet{id}.xml` files chunk-by-chunk
// and a bug was discovered when `<sheetData/>` element wasn't present in the first chunk.
// https://github.com/catamphetamine/read-excel-file/pull/125
//
// Another way to test this would be to temporarily set the `INITIAL_CHUNK_SIZE` constant
// to `1` in `parseXml.js` file.
//
export default async function({ readSheetFromFile, expect }) {
	const data = await readSheetFromFile()
	expect(data).to.deep.equal([['Test']])
}
