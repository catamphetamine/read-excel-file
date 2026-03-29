import { describe, it } from 'mocha'
import { expect } from 'chai'

import isDateFormat from './isDateFormat.js'

describe('xlsx/isDateFormat', () => {
	it('should detect date format', () => {
		expect(isDateFormat('dd/mm/yyyy')).to.equal(true)
		expect(isDateFormat('dd/mm/yy;@')).to.equal(true)
		expect(isDateFormat('d/m/yyyy;@')).to.equal(true)
		expect(isDateFormat('d/m/yy;@')).to.equal(true)
		expect(isDateFormat('[$-419]d-mmm-yyyy;@')).to.equal(true)
		expect(isDateFormat('[$-419]mmmm yyyy;@')).to.equal(true)
		expect(isDateFormat('[$-419]d mmm;@')).to.equal(true)
		expect(isDateFormat('[$-419]d mmm yy;@')).to.equal(true)
		expect(isDateFormat('[$-419]d mmm yyyy;@')).to.equal(true)
		expect(isDateFormat('[$-FC19]dd mmmm yyyy;@')).to.equal(true)
		expect(isDateFormat('[$-FC19]dd mmmm yyyy г.;@')).to.equal(false)
		expect(isDateFormat('[$-419]dddd d mmmm yyyy г.;@')).to.equal(false)
	})

	it('should detect non-date format', () => {
		expect(isDateFormat('$#,##0.00')).to.equal(false)
		expect(isDateFormat('0.0%')).to.equal(false)
	})
})