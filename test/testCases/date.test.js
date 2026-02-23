import readXlsxFile from '../../source/export/readXlsxFileNode.js'

describe('date', () => {
	it('should parse dates', async () => {
		const data = await readXlsxFile('./test/testCases/date.xlsx')

		expect(data).to.deep.equal([
			// ['Date'],
			[new Date('2021-06-10T00:47:45.700Z')]
		])
	})
})