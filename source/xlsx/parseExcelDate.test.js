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
		expect(parseExcelDate(43183 - DAYS_BETWEEN_1900_EPOCH_AND_1904_EPOCH, true).getTime()).to.equal(date.getTime())
	})

	it('should not lose a millisecond to floating-point error in the time part', () => {
		// Excel stores "2023-01-01 16:00" as 44927.666666666664,
		// which is a tiny bit less than the exact value.
		expect(parseExcelDate(44927.666666666664).toISOString()).to.equal('2023-01-01T16:00:00.000Z')
		// Excel stores "1970-01-01 02:24" as 25569.1.
		expect(parseExcelDate(25569.1).toISOString()).to.equal('1970-01-01T02:24:00.000Z')
		// Excel stores "2023-01-01 00:00:01" as 44927.00001157407.
		expect(parseExcelDate(44927.00001157407).toISOString()).to.equal('2023-01-01T00:00:01.000Z')
	})
})
