import fs from 'fs'

import readXlsx from '../source/read/readXlsxFileNode.js'

describe('buffer', () => {
	it('should read an excel file from a buffer', async () => {
		const spreadsheetContents = fs.readFileSync('./test/spreadsheets/inline-string.xlsx')

		const contentsBuffer = Buffer.from(spreadsheetContents)

		const data = await readXlsx(contentsBuffer)

		expect(data).to.deep.equal([
			// ['String'],
			['Test 123']
		])
	})

	it('should handle empty buffer input', async () => {
		expect(() => readXlsx(Buffer.alloc(0))).to.throw('No data')
	})
})