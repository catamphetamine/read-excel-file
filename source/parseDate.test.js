import parseDate, { convert_to_utc_timezone } from './parseDate'

describe('parseDate', () => {
	it('should parse dates', () => {
		let date = new Date(2018, 3 - 1, 24, 12)
		date = convert_to_utc_timezone(date)
		parseDate('03/24/2018', 'MM/DD/YYYY', true, true).getTime().should.equal(date.getTime())
	})
})