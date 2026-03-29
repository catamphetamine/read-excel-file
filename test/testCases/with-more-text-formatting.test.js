import { describe, it } from 'mocha'
import { expect } from 'chai'

import readSheet from '../../source/export/readSheetNode.js'

describe('with more text formatting', () => {
	it('should read a file with text more formatting', async () => {
		const data = await readSheet('./test/testCases/with-more-text-formatting.xlsx', { trim: false })

		expect(data).to.deep.equal([
			[ 'id', 'memo' ],
			[ 1, 'abc def ghi ' ],
			[ 2, 'pqr stu' ]
		])
	})
})