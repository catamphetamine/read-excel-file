import { describe, it } from 'mocha'
import { expect } from 'chai'

import readSheet from '../../source/export/readSheetNode.js'

describe('boolean', () => {
	it('should parse booleans', async () => {
		const data = await readSheet('./test/testCases/boolean.xlsx')

		expect(data).to.deep.equal([
			['Boolean'],
			[true],
			[false],
			[1],
			[0]
		])
	})
})