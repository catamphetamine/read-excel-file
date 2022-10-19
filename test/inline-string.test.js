import readXlsx from '../source/read/readXlsxFileNode.js'

describe('inline string', () => {
	it('should parse inline strings', async () => {
		const data = await readXlsx('./test/spreadsheets/inline-string.xlsx')

		expect(data).to.deep.equal([
			// ['String'],
			['Test 123']
		])
	})
})