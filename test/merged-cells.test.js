import readXlsx from '../source/read/readXlsxFileNode'

describe('merged cells', () => {
	it('should parse inline strings', async () => {
		const data = await readXlsx(__dirname + '/spreadsheets/merged-cells.xlsx',)

		expect(data).to.deep.equal([
			['A1', 'B1', 'C1', 'D1'],
			['A2', 'B2', 'C2', 'D2']
		])
	})
})