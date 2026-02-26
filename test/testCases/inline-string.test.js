import { describe, it } from 'mocha'
import { expect } from 'chai'

import readXlsxFile from '../../source/export/readXlsxFileNode.js'

describe('inline string', () => {
	it('should parse inline strings', async () => {
		const data = await readXlsxFile('./test/testCases/inline-string.xlsx')

		expect(data).to.deep.equal([
			['Test 123']
		])
	})
})