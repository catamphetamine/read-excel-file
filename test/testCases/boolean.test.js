import { describe, it } from 'mocha'
import { expect } from 'chai'

import readXlsxFile from '../../source/export/readXlsxFileNode.js'

describe('boolean', () => {
	it('should parse booleans', async () => {
		const data = await readXlsxFile('./test/testCases/boolean.xlsx')

		expect(data).to.deep.equal([
			['Boolean'],
			[true],
			[false],
			[1],
			[0]
		])
	})
})