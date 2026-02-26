import { describe, it } from 'mocha'
import { expect } from 'chai'

import readXlsxFile from '../../source/export/readXlsxFileNode.js'

describe('with text formatting', () => {
	it('should read a file with text formatting', async () => {
		const data = await readXlsxFile('./test/testCases/mac-2011-with-text-formatting.xlsx', { trim: false })

		expect(data).to.deep.equal([
			[ 'Hey', 'now', 'so' ],
			[ 'cool', null, null ]
		])
	})
})