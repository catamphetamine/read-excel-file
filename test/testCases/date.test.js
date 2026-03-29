import { describe, it } from 'mocha'
import { expect } from 'chai'

import readSheet from '../../source/export/readSheetNode.js'

describe('date', () => {
	it('should parse dates', async () => {
		const data = await readSheet('./test/testCases/date.xlsx')

		expect(data).to.deep.equal([
			// ['Date'],
			[new Date('2021-06-10T00:47:45.700Z')]
		])
	})
})