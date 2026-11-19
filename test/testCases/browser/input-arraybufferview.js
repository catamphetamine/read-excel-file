export default async function({ getInputArgument, readSheet, expect }) {
	const arrayBuffer = getInputArgument()

	const data = await readSheet(new Uint16Array(arrayBuffer))

	expect(data).to.deep.equal([
		// ['String'],
		['Test 123']
	])

	// should handle empty buffer input
	let thrown
	try {
		await readSheet(Buffer.alloc(0))
	} catch (error) {
		thrown = error
	}
	expect(thrown).to.be.an('error')
	expect(thrown.code).to.equal('NO_DATA')
}