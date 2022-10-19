import readXlsx from '../source/read/readXlsxFileNode.js'

describe('boolean', () => {
	it('should parse booleans', async () => {
		const data = await readXlsx('./test/spreadsheets/boolean.xlsx')

		expect(data).to.deep.equal([
			['Boolean'],
			[true],
			[false],
			[1],
			[0]
		])
	})
})