import readXlsx from '../source/readXlsxFileNode'

describe('boolean', () => {
	it('should parse booleans', async () => {
		const data = await readXlsx(__dirname + '/spreadsheets/boolean.xlsx',)

		expect(data).to.deep.equal([
			['Boolean'],
			[true],
			[false],
			[1],
			[0]
		])
	})
})