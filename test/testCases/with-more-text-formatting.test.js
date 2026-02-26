import { describe, it } from 'mocha'
import { expect } from 'chai'

import readXlsxFile from '../../source/export/readXlsxFileNode.js'

describe('with more text formatting', () => {
	it('should read a file with text more formatting', async () => {
		const data = await readXlsxFile('./test/testCases/with-more-text-formatting.xlsx', { trim: false })

		expect(data).to.deep.equal([
			[ 'id', 'memo' ],
			[ 1, 'abc def ghi ' ],
			[ 2, 'pqr stu' ]
		])
	})
})