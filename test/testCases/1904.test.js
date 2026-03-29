import { describe, it } from 'mocha'
import { expect } from 'chai'

import readSheet from '../../source/export/readSheetNode.js'

describe('1904', () => {
	it('should parse 1904 macOS dates', async () => {
		const data = await readSheet('./test/testCases/1904.xlsx')

		expect(data.length).to.equal(6)

		expect(data[0][0]).to.equal('Date')
		expect(data[1][0].toISOString()).to.equal('2018-05-05T00:00:00.000Z')
		expect(data[2][0].toISOString()).to.equal('2018-05-05T00:00:00.000Z')
		expect(data[3][0].toISOString()).to.equal('2018-05-05T00:00:00.000Z')
		expect(data[4][0].toISOString()).to.equal('2018-05-05T00:00:00.000Z')
		expect(data[5][0].toISOString()).to.equal('2018-05-05T00:00:00.000Z')
	})
})