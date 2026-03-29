import { describe, it } from 'mocha'
import { expect } from 'chai'

import readSheet from '../../source/export/readSheetNode.js'

describe('with text formatting', () => {
	it('should read a file with text formatting', async () => {
		const data = await readSheet('./test/testCases/mac-2011-with-text-formatting.xlsx', { trim: false })

		expect(data).to.deep.equal([
			[ 'Hey', 'now', 'so' ],
			[ 'cool', null, null ]
		])
	})
})