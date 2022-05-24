import readXlsx from '../source/read/readXlsxFileNode.js'

describe('inline string', () => {
	it('should parse inline strings', async () => {
		const data = await readXlsx('./test/spreadsheets/trim.xlsx', { trim: false })

		expect(data).to.deep.equal([
			[' text ']
		])
	})
})