import { describe, it } from 'mocha'
import { expect } from 'chai'

import readSheet from '../../source/export/readSheetNode.js'

describe('inline string', () => {
	it('should parse inline strings', async () => {
		const data = await readSheet('./test/testCases/trim.xlsx', { trim: false })

		expect(data).to.deep.equal([
			[' text ']
		])
	})
})