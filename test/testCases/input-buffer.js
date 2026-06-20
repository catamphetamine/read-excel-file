export default async function({ readFile, readSheet, expect }) {
	const contentsBuffer = readFile()

	const data = await readSheet(contentsBuffer)

	expect(data).to.deep.equal([
		// ['String'],
		['Test 123']
	])

	// should handle empty buffer input
	const emptyBuffer = Buffer.alloc(0)
	expect(() => readSheet(emptyBuffer)).to.throw('No data')
}