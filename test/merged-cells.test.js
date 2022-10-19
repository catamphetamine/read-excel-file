import readXlsx from '../source/read/readXlsxFileNode.js'

describe('merged cells', () => {
	it('should parse inline strings', async () => {
		const data = await readXlsx('./test/spreadsheets/merged-cells.xlsx')

		expect(data).to.deep.equal([
			['A1', 'B1', 'C1', 'D1'],
			['A2', 'B2', 'C2', 'D2']
		])
	})
})