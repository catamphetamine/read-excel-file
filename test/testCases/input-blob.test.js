import { describe, it } from 'mocha'
import { expect } from 'chai'

import fs from 'fs'

import readXlsxFile from '../../source/export/readXlsxFileNode.js'

describe('input: `Blob`', () => {
	it('should read an excel file from a blob', async () => {
		const spreadsheetContents = fs.readFileSync('./test/testCases/inline-string.xlsx')

		const contentsBuffer = Buffer.from(spreadsheetContents)
		const contentsBlob = new Blob([contentsBuffer])

		const data = await readXlsxFile(contentsBlob)

		expect(data).to.deep.equal([
			// ['String'],
			['Test 123']
		])
	})

	it('should handle empty blob input', async () => {
		const emptyBlob = new Blob()
		expect(() => readXlsxFile(emptyBlob)).to.throw('No data')
	})
})