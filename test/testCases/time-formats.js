export default async function({ readSheetFromFile, expect }) {
	const data = await readSheetFromFile()

	expect(data.length).to.equal(4)

	expect(data[0][0]).to.equal('United States')
	expect(data[0][1]).to.deep.equal(new Date('2001-01-01T00:00:00.000Z'))
	expect(data[0][2]).to.deep.equal(new Date('2001-01-01T00:00:00.000Z'))
	expect(data[0][3]).to.deep.equal(new Date('2001-01-01T00:00:00.000Z'))
	expect(data[0][4]).to.deep.equal(new Date('2001-01-01T00:00:00.000Z'))
	expect(data[0][5]).to.deep.equal(new Date('2001-01-01T00:00:00.000Z'))
	expect(data[0][6]).to.deep.equal(new Date('2001-01-01T00:00:00.000Z'))
	expect(data[0][7]).to.equal(undefined)

	expect(data[1][0]).to.equal('Japan')
	expect(data[1][1]).to.deep.equal(new Date('2001-01-01T00:00:00.000Z'))
	expect(data[1][2]).to.equal(null)

	expect(data[2][0]).to.equal('China')
	expect(data[2][1]).to.deep.equal(new Date('2001-01-01T00:00:00.000Z'))
	expect(data[2][2]).to.equal(null)

	expect(data[3][0]).to.equal('Korea')
	expect(data[3][1]).to.deep.equal(new Date('2001-01-01T00:00:00.000Z'))
	expect(data[3][2]).to.deep.equal(new Date('2001-01-01T00:00:00.000Z'))
	expect(data[3][3]).to.equal(null)
}