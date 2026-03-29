import { describe, it } from 'mocha'
import { expect } from 'chai'

import readSheet from '../../source/export/readSheetNode.js'

describe('basic', () => {
	it('should read basic file', async () => {
		const data = await readSheet('./test/testCases/mac-2011-basic.xlsx', { trim: false })

		expect(data).to.deep.equal([
			[ 'One', 'Two' ],
			[ 'Three', 'Four' ]
		])
	})
})