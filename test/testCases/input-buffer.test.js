import fs from 'fs'

import readXlsxFile from '../../source/export/readXlsxFileNode.js'

describe('input: `Buffer`', () => {
	it('should read an excel file from a buffer', async () => {
		const spreadsheetContents = fs.readFileSync('./test/testCases/inline-string.xlsx')

		const contentsBuffer = Buffer.from(spreadsheetContents)

		const data = await readXlsxFile(contentsBuffer)

		expect(data).to.deep.equal([
			// ['String'],
			['Test 123']
		])
	})

	it('should handle empty buffer input', async () => {
		const emptyBuffer = Buffer.alloc(0)
		expect(() => readXlsxFile(emptyBuffer)).to.throw('No data')
	})
})