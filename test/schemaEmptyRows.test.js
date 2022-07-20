import path from 'path'

import readXlsx from '../source/read/readXlsxFileNode.js'

describe('read-excel-file', function() {
	it('should ignore empty rows by default', async function() {
		const rowMap = []
		const { rows, errors } = await readXlsx(path.resolve('./test/spreadsheets/schemaEmptyRows.xlsx'), { schema, rowMap })
		rows.should.deep.equal([{
			date: new Date(Date.UTC(2018, 2, 24)),
			numberOfStudents: 123,
			course: {
				isFree: false,
				cost: 210.45,
				title: 'Chemistry'
			},
			contact: '+11234567890'
		}, {
			date: new Date(Date.UTC(2018, 2, 24)),
			numberOfStudents: 123,
			course: {
				isFree: false,
				cost: 210.45,
				title: 'Chemistry'
			},
			contact: '+11234567890'
		}])
		errors.should.deep.equal([])
		rowMap.should.deep.equal([0, 1, 2, 3])
	})

	it('should ignore empty rows by default (throws error)', async function() {
		const rowMap = []
		const { rows, errors } = await readXlsx(path.resolve('./test/spreadsheets/schemaEmptyRows.xlsx'), { schema: schemaThrowsError, rowMap })
		errors.should.deep.equal([{
			error: 'invalid',
			reason: 'not_a_boolean',
			value: '(123) 456-7890',
			row: 2,
			column: 'CONTACT',
			type: Boolean
		}, {
			error: 'invalid',
			reason: 'not_a_boolean',
			value: '(123) 456-7890',
			row: 4,
			column: 'CONTACT',
			type: Boolean
		}])
		rowMap.should.deep.equal([0, 1, 2, 3])
	})

	it('should not ignore empty rows when `ignoreEmptyRows: false` flag is passed', async function() {
		const rowMap = []
		const { rows, errors } = await readXlsx(path.resolve('./test/spreadsheets/schemaEmptyRows.xlsx'), { schema, rowMap, ignoreEmptyRows: false })
		rows.should.deep.equal([{
			date: new Date(Date.UTC(2018, 2, 24)),
			numberOfStudents: 123,
			course: {
				isFree: false,
				cost: 210.45,
				title: 'Chemistry'
			},
			contact: '+11234567890'
		}, null, {
			date: new Date(Date.UTC(2018, 2, 24)),
			numberOfStudents: 123,
			course: {
				isFree: false,
				cost: 210.45,
				title: 'Chemistry'
			},
			contact: '+11234567890'
		}])
		errors.should.deep.equal([])
		rowMap.should.deep.equal([0, 1, 2, 3])
	})

	it('should not ignore empty rows when `ignoreEmptyRows: false` flag is passed (throws error)', async function() {
		const rowMap = []
		const { rows, errors } = await readXlsx(path.resolve('./test/spreadsheets/schemaEmptyRows.xlsx'), { schema: schemaThrowsError, rowMap })
		errors.should.deep.equal([{
			error: 'invalid',
			reason: 'not_a_boolean',
			value: '(123) 456-7890',
			row: 2,
			column: 'CONTACT',
			type: Boolean
		}, {
			error: 'invalid',
			reason: 'not_a_boolean',
			value: '(123) 456-7890',
			row: 4,
			column: 'CONTACT',
			type: Boolean
		}])
		rowMap.should.deep.equal([0, 1, 2, 3])
	})
})

const schema = {
	'START DATE': {
		prop: 'date',
		type: Date
	},
	'NUMBER OF STUDENTS': {
		prop: 'numberOfStudents',
		type: Number
	},
	'COURSE': {
		prop: 'course',
		type: {
			'IS FREE': {
				prop: 'isFree',
				type: Boolean
				// Excel stored booleans as numbers:
				// `1` is `true` and `0` is `false`.
				// Such numbers are parsed to booleans.
			},
			'COST': {
				prop: 'cost',
				type: Number
			},
			'COURSE TITLE': {
				prop: 'title',
				type: String
			}
		}
	},
	'CONTACT': {
		prop: 'contact',
		type(value) {
			return '+11234567890'
		}
	}
}

const schemaThrowsError = {
	...schema,
	'CONTACT': {
		prop: 'contact',
		type: Boolean
	}
}

// Converts timezone to UTC while preserving the same time
function convertToUTCTimezone(date) {
	// Doesn't account for leap seconds but I guess that's ok
	// given that javascript's own `Date()` does not either.
	// https://www.timeanddate.com/time/leap-seconds-background.html
	//
	// https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Date/getTimezoneOffset
	//
	return new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000)
}
