export default async function({ readFile, readSheet, expect }) {
	const contentsBuffer = readFile()

	const contentsBlob = new Blob([contentsBuffer])

	const data = await readSheet(contentsBlob)

	expect(data).to.deep.equal([
		// ['String'],
		['Test 123']
	])

	// should handle empty blob input
	const emptyBlob = new Blob()
	expect(() => readSheet(emptyBlob)).to.throw('No data')
}