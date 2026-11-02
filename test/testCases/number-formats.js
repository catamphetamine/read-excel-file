export default async function({ readSheetFromFile, expect }) {
	const data = await readSheetFromFile()

	expect(data.length).to.equal(1)

	expect(data[0][0]).to.equal(1)
	expect(data[0][1]).to.equal(1)
	expect(data[0][2]).to.equal(1)
	expect(data[0][3]).to.equal(1)
	expect(data[0][4]).to.equal(1)
	expect(data[0][5]).to.equal(1)
	expect(data[0][6]).to.equal(1)
	expect(data[0][7]).to.equal(1)
	expect(data[0][8]).to.equal(1)
	expect(data[0][9]).to.equal(1)
	expect(data[0][10]).to.equal(1)
	expect(data[0][11]).to.equal(1)
	expect(data[0][12]).to.equal(1)
	expect(data[0][13]).to.equal(1)
	expect(data[0][14]).to.equal(undefined)
}