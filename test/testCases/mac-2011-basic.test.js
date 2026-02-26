import { describe, it } from 'mocha'
import { expect } from 'chai'

import readXlsxFile from '../../source/export/readXlsxFileNode.js'

describe('basic', () => {
	it('should read basic file', async () => {
		const data = await readXlsxFile('./test/testCases/mac-2011-basic.xlsx', { trim: false })

		expect(data).to.deep.equal([
			[ 'One', 'Two' ],
			[ 'Three', 'Four' ]
		])
	})
})