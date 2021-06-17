import readXlsx from '../source/read/readXlsxFileNode'

describe('date', () => {
	it('should parse dates', async () => {
		const data = await readXlsx(__dirname + '/spreadsheets/date.xlsx')

		expect(data).to.deep.equal([
			// ['Date'],
			[new Date('2021-06-10T00:47:45.700Z')]
		])
	})
})