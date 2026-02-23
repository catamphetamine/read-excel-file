import readXlsxFile from '../../source/export/readXlsxFileNode.js'

describe('inline string', () => {
	it('should parse inline strings', async () => {
		const data = await readXlsxFile('./test/testCases/trim.xlsx', { trim: false })

		expect(data).to.deep.equal([
			[' text ']
		])
	})
})