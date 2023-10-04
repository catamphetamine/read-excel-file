import path from 'path'

import readXlsx from '../source/read/readXlsxFileNode.js'

describe('read-excel-file', () => {
	it('should support custom `parseNumber` function', () => {
		const schema = {
			'START DATE': {
				prop: 'date',
				type: Date
			},
			'NUMBER OF STUDENTS': {
				prop: 'numberOfStudents',
				type: Number,
				required: true
			},
			'COST': {
				prop: 'cost',
				type: (any) => any
			}
		}

		return readXlsx(path.resolve('./test/spreadsheets/course.xlsx'), {
			schema,
			parseNumber: (string) => string
		}).then(({ rows, errors }) => {
			rows[0].date = rows[0].date.getTime()
			rows.should.deep.equal([{
				date: convertToUTCTimezone(new Date(2018, 2, 24)).getTime(),
				numberOfStudents: 123,
				cost: '210.45'
			}])
			errors.should.deep.equal([])
		})
	})
})

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
