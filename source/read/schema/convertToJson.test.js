import convertToJson, { parseArray, getBlock } from './convertToJson.js'

import Integer from '../../types/Integer.js'
import URL from '../../types/URL.js'
import Email from '../../types/Email.js'

const date = convertToUTCTimezone(new Date(2018, 3 - 1, 24))

describe('convertToJson', () => {
	it('should parse arrays', () => {
		getBlock('abc"de,f"g,h', ',', 0).should.deep.equal(['abcde,fg', 10])
		parseArray(' abc"de,f"g  , h ').should.deep.equal(['abcde,fg', 'h'])
	})

	it('should convert to json', () => {
		const { rows, errors } = convertToJson([
			[
				'DATE',
				'NUMBER',
				'BOOLEAN',
				'STRING',
				'PHONE',
				'PHONE_TYPE'
			], [
				new Date(Date.parse('03/24/2018') - new Date().getTimezoneOffset() * 60 * 1000), // '43183', // '03/24/2018',
				'123',
				true,
				'abc',
				'(123) 456-7890',
				'(123) 456-7890'
			]
		], {
			DATE: {
				prop: 'date',
				type: Date
			},
			NUMBER: {
				prop: 'number',
				type: Number
			},
			BOOLEAN: {
				prop: 'boolean',
				type: Boolean
			},
			STRING: {
				prop: 'string',
				type: String
			},
			PHONE: {
				prop: 'phone',
				parse(value) {
					return '+11234567890'
				}
			},
			PHONE_TYPE: {
				prop: 'phoneType',
				type(value) {
					return '+11234567890'
				}
			}
		})

		errors.should.deep.equal([])

		// Convert `Date` to `String` for equality check.
		rows[0].date = rows[0].date.toISOString()

		rows.should.deep.equal([{
			date: date.toISOString(),
			number: 123,
			phone: '+11234567890',
			phoneType: '+11234567890',
			boolean: true,
			string: 'abc'
		}])
	})

	it('should support schema entries with no `type`s', () => {
		const { rows, errors } = convertToJson([
			[
				'DATE',
				'NUMBER',
				'BOOLEAN',
				'STRING'
			], [
				new Date(Date.parse('03/24/2018') - new Date().getTimezoneOffset() * 60 * 1000), // '43183', // '03/24/2018',
				123,
				true,
				'abc'
			]
		], {
			DATE: {
				prop: 'date'
			},
			NUMBER: {
				prop: 'number'
			},
			BOOLEAN: {
				prop: 'boolean'
			},
			STRING: {
				prop: 'string'
			}
		})

		errors.should.deep.equal([])

		// Convert `Date` to `String` for equality check.
		rows[0].date = rows[0].date.toISOString()

		rows.should.deep.equal([{
			date: date.toISOString(),
			number: 123,
			boolean: true,
			string: 'abc'
		}])
	})

	it('should require fields', () => {
		const { rows, errors } = convertToJson([
			[
				'NUMBER'
			], [
				null
			]
		], {
			NUMBER: {
				prop: 'number',
				type: Number,
				required: true
			}
		})

		errors.should.deep.equal([{
			error: 'required',
			row: 2,
			column: 'NUMBER',
			type: Number,
			value: null
		}])

		rows.should.deep.equal([])
	})

	it('should parse arrays', () => {
		const { rows, errors } = convertToJson([
			[
				'NAMES'
			], [
				'Barack Obama, "String, with, colons", Donald Trump'
			], [
				null
			]
		], {
			NAMES: {
				prop: 'names',
				type: [String]
			}
		})

		errors.should.deep.equal([])

		rows.should.deep.equal([{
			names: ['Barack Obama', 'String, with, colons', 'Donald Trump']
		}])
	})

	it('should parse integers', () =>
	{
		const { rows, errors } = convertToJson([
			[
				'INTEGER'
			], [
				'1'
			], [
				'1.2'
			]
		], {
			INTEGER: {
				prop: 'value',
				type: Integer
			}
		})

		errors.length.should.equal(1)
		errors[0].should.deep.equal({
			error: 'invalid',
			reason: 'not_an_integer',
			row: 3,
			column: 'INTEGER',
			type: Integer,
			value: '1.2'
		})

		rows.should.deep.equal([{
			value: 1
		}])
	})

	it('should parse URLs', () =>
	{
		const { rows, errors } = convertToJson([
			[
				'URL'
			], [
				'https://kremlin.ru'
			], [
				'kremlin.ru'
			]
		], {
			URL: {
				prop: 'value',
				type: URL
			}
		})

		errors.length.should.equal(1)
		errors[0].row.should.equal(3)
		errors[0].column.should.equal('URL')
		errors[0].error.should.equal('invalid')

		rows.should.deep.equal([{
			value: 'https://kremlin.ru'
		}])
	})

	it('should parse Emails', () =>
	{
		const { rows, errors } = convertToJson([
			[
				'EMAIL'
			], [
				'vladimir.putin@kremlin.ru'
			], [
				'123'
			]
		], {
			EMAIL: {
				prop: 'value',
				type: Email
			}
		})

		errors.length.should.equal(1)
		errors[0].row.should.equal(3)
		errors[0].column.should.equal('EMAIL')
		errors[0].error.should.equal('invalid')

		rows.should.deep.equal([{
			value: 'vladimir.putin@kremlin.ru'
		}])
	})

	it('should call .validate()', () => {
		const { rows, errors } = convertToJson([
			[
				'NAME'
			], [
				'George Bush'
			]
		], {
			NAME: {
				prop: 'name',
				type: String,
				required: true,
				validate: (value) => {
					if (value === 'George Bush') {
						throw new Error('custom-error')
					}
				}
			}
		})

		errors.should.deep.equal([{
			error: 'custom-error',
			row: 2,
			column: 'NAME',
			type: String,
			value: 'George Bush'
		}])

		rows.should.deep.equal([])
	})

	it('should validate numbers', () => {
		const { rows, errors } = convertToJson([
			[
				'NUMBER'
			], [
				'123abc'
			]
		], {
			NUMBER: {
				prop: 'number',
				type: Number,
				required: true
			}
		})

		errors.should.deep.equal([{
			error: 'invalid',
			reason: 'not_a_number_string',
			row: 2,
			column: 'NUMBER',
			type: Number,
			value: '123abc'
		}])

		rows.should.deep.equal([])
	})

	it('should validate booleans', () => {
		const { rows, errors } = convertToJson([
			[
				'TRUE',
				'FALSE',
				'INVALID'
			], [
				true,
				false,
				'TRUE'
			]
		], {
			TRUE: {
				prop: 'true',
				type: Boolean,
				required: true
			},
			FALSE: {
				prop: 'false',
				type: Boolean,
				required: true
			},
			INVALID: {
				prop: 'invalid',
				type: Boolean,
				required: true
			}
		})

		errors.should.deep.equal([{
			error: 'invalid',
			reason: 'not_a_boolean',
			row: 2,
			column: 'INVALID',
			type: Boolean,
			value: 'TRUE'
		}])

		rows.should.deep.equal([{
			true: true,
			false: false
		}])
	})

	it('should validate dates', () => {
		const { rows, errors } = convertToJson([
			[
				'DATE',
				'INVALID'
			], [
				43183, // 03/24/2018',
				'-'
			], [
				date, // 03/24/2018',,
				'-'
			]
		], {
			DATE: {
				prop: 'date',
				type: Date,
				required: true
			},
			INVALID: {
				prop: 'invalid',
				type: Date,
				required: true
			}
		})

		errors.should.deep.equal([{
			error: 'invalid',
			reason: 'not_a_number',
			row: 2,
			column: 'INVALID',
			type: Date,
			value: '-'
		}, {
			error: 'invalid',
			reason: 'not_a_number',
			row: 3,
			column: 'INVALID',
			type: Date,
			value: '-'
		}])

		rows.should.deep.equal([{
			date
		}, {
			date
		}])
	})

	it('should throw parse() errors', () => {
		const { rows, errors } = convertToJson([
			[
				'PHONE',
				'PHONE_TYPE'
			], [
				'123',
				'123'
			]
		], {
			PHONE: {
				prop: 'phone',
				parse: () => {
					throw new Error('invalid')
				}
			},
			PHONE_TYPE: {
				prop: 'phoneType',
				parse: () => {
					throw new Error('invalid')
				}
			}
		})

		errors.should.deep.equal([{
			error: 'invalid',
			row: 2,
			column: 'PHONE',
			value: '123'
		}, {
			error: 'invalid',
			row: 2,
			column: 'PHONE_TYPE',
			value: '123'
		}])

		rows.should.deep.equal([])
	})

	it('should map row numbers', () => {
		const { rows, errors } = convertToJson([
			[
				'NUMBER'
			], [
				'123abc'
			]
		], {
			NUMBER: {
				prop: 'number',
				type: Number
			}
		}, {
			rowMap: [2, 5]
		})

		errors.should.deep.equal([{
			error: 'invalid',
			reason: 'not_a_number_string',
			row: 6,
			column: 'NUMBER',
			type: Number,
			value: '123abc'
		}])
	})

	it('should validate "oneOf" (valid)', () => {
		const { rows, errors } = convertToJson([
			[
				'STATUS'
			],
			[
				'STARTED'
			]
		], {
			STATUS: {
				prop: 'status',
				type: String,
				oneOf: [
					'STARTED',
					'FINISHED'
				]
			}
		})

		errors.length.should.equal(0)
	})

	it('should validate "oneOf" (not valid)', () => {
		const { rows, errors } = convertToJson([
			[
				'STATUS'
			],
			[
				'SCHEDULED'
			]
		], {
			STATUS: {
				prop: 'status',
				type: String,
				oneOf: [
					'STARTED',
					'FINISHED'
				]
			}
		})

		errors.should.deep.equal([{
			error: 'invalid',
			reason: 'unknown',
			row: 2,
			column: 'STATUS',
			type: String,
			value: 'SCHEDULED'
		}])
	})

	it('should not include `null` values by default', function() {
		const { rows } = convertToJson(
			[
				['A', 'B', 'CA', 'CB'],
				['a', 'b', 'ca', null],
				['a', null]
			],
			{
				A: {
					prop: 'a',
					type: String
				},
				B: {
					prop: 'b',
					type: String
				},
				C: {
					prop: 'c',
    			type: {
						CA: {
							prop: 'a',
							type: String
						},
						CB: {
							prop: 'b',
							type: String
						}
					}
				}
			}
		)

		rows.should.deep.equal([
			{ a: 'a', b: 'b', c: { a: 'ca' } },
			{ a: 'a' },
		])
	})

	it('should include `null` values when `includeNullValues: true` option is passed', function() {
		const { rows } = convertToJson(
			[
				['A', 'B', 'CA', 'CB'],
				['a', 'b', 'ca', null],
				['a', null]
			],
			{
				A: {
					prop: 'a',
					type: String
				},
				B: {
					prop: 'b',
					type: String
				},
				C: {
					prop: 'c',
    			type: {
						CA: {
							prop: 'a',
							type: String
						},
						CB: {
							prop: 'b',
							type: String
						}
					}
				}
			},
			{
				includeNullValues: true
			}
		)

		rows.should.deep.equal([
			{ a: 'a', b: 'b', c: { a: 'ca', b: null } },
			{ a: 'a', b: null, c: null },
		])
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
