import readXlsx from '../source/read/readXlsxFileNode.js'

describe('date', () => {
	it('should parse dates', async () => {
		const data = await readXlsx('./test/spreadsheets/date.xlsx')

		expect(data).to.deep.equal([
			// ['Date'],
			[new Date('2021-06-10T00:47:45.700Z')]
		])
	})
})