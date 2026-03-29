import { describe, it } from 'mocha'
import { expect } from 'chai'

import parseExcelDate from './parseExcelDate.js'

describe('parseExcelDate', () => {
	it('should parse Excel "serial" dates', () => {
		const date = new Date(Date.UTC(2018, 3 - 1, 24))
    // Excel stores dates as integers.
    // E.g. '24/03/2018' === 43183
		expect(parseExcelDate(43183).getTime()).to.equal(date.getTime())
	})

	it('should parse Excel "serial" dates (1904 baseline)', () => {
		const date = new Date(Date.UTC(2018, 3 - 1, 24))
    // Excel stores dates as integers.
    // E.g. '24/03/2018' === 43183
		const DAYS_BETWEEN_1900_EPOCH_AND_1904_EPOCH = 1462
		expect(parseExcelDate(43183 - DAYS_BETWEEN_1900_EPOCH_AND_1904_EPOCH, { epoch1904: true }).getTime()).to.equal(date.getTime())
	})
})
