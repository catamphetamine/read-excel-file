import { describe, it } from 'mocha'
import { expect } from 'chai'

import readSheet from '../../source/export/readSheetNode.js'

describe('inline string', () => {
	it('should parse inline strings', async () => {
		const data = await readSheet('./test/testCases/inline-string.xlsx')

		expect(data).to.deep.equal([
			['Test 123']
		])
	})
})