export default async function({ readSheetFromFile, filePath, expect }) {
	const data = await readSheetFromFile()

	expect(data.length).to.equal(6)

	expect(data[0][0]).to.equal('Date')
	expect(data[1][0].toISOString()).to.equal('2018-05-05T00:00:00.000Z')
	expect(data[2][0].toISOString()).to.equal('2018-05-05T00:00:00.000Z')
	expect(data[3][0].toISOString()).to.equal('2018-05-05T00:00:00.000Z')
	expect(data[4][0].toISOString()).to.equal('2018-05-05T00:00:00.000Z')
	expect(data[5][0].toISOString()).to.equal('2018-05-05T00:00:00.000Z')
}