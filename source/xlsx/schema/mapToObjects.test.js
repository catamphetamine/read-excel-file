import mapToObjects, { parseArray, getBlock } from './mapToObjects.js'

import Integer from '../../types/Integer.js'
import URL from '../../types/URL.js'
import Email from '../../types/Email.js'

const date = convertToUTCTimezone(new Date(2018, 3 - 1, 24))

describe('mapToObjects', () => {
	it('should parse arrays', () => {
		getBlock('abc"de,f"g,h', ',', 0).should.deep.equal(['abcde,fg', 10])
		parseArray(' abc"de,f"g  , h ', ',').should.deep.equal(['abcde,fg', 'h'])
	})

	it('should convert to json', () => {
		const { rows, errors } = mapToObjects([
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
			date: {
				column: 'DATE',
				type: Date
			},
			number: {
				column: 'NUMBER',
				type: Number
			},
			boolean: {
				column: 'BOOLEAN',
				type: Boolean
			},
			string: {
				column: 'STRING',
				type: String
			},
			phone: {
				column: 'PHONE',
				type(value) {
					return '+11234567890'
				}
			},
			phoneType: {
				column: 'PHONE_TYPE',
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
		const { rows, errors } = mapToObjects([
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
			date: {
				column: 'DATE'
			},
			number: {
				column: 'NUMBER'
			},
			boolean: {
				column: 'BOOLEAN'
			},
			string: {
				column: 'STRING'
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

	it('should require fields when cell value is empty', () => {
		const { rows, errors } = mapToObjects([
			[
				'NUMBER',
				'STRING'
			],
			[
				null,
				'abc'
			]
		], {
			number: {
				column: 'NUMBER',
				type: Number,
				required: true
			},
			string: {
				column: 'STRING',
				type: String,
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

		rows.should.deep.equal([{
			number: null,
			string: 'abc'
		}])
	})

	it('shouldn\'t require fields when cell value is empty and object is empty too (`ignoreEmptyRows: false`', () => {
		const { rows, errors } = mapToObjects([
			[
				'NUMBER'
			],
			[
				null
			]
		], {
			number: {
				column: 'NUMBER',
				type: Number,
				required: true
			}
		}, {
			ignoreEmptyRows: false
		})

		rows.should.deep.equal([null])
	})

	it('shouldn\'t require fields when cell value is empty and object is empty too (`ignoreEmptyRows` not specified)', () => {
		const { rows, errors } = mapToObjects([
			[
				'NUMBER'
			],
			[
				null
			]
		], {
			number: {
				column: 'NUMBER',
				type: Number,
				required: true
			}
		})

		rows.should.deep.equal([])
	})

	it('should parse arrays (`ignoreEmptyRows: false`)', () => {
		const { rows, errors } = mapToObjects([
			[
				'NAMES'
			], [
				'Barack Obama, "String, with, colons", Donald Trump'
			], [
				null
			]
		], {
			names: {
				column: 'NAMES',
				type: [String]
			}
		}, {
			ignoreEmptyRows: false
		})

		errors.should.deep.equal([])

		rows.should.deep.equal([{
			names: ['Barack Obama', 'String, with, colons', 'Donald Trump']
		}, null])
	})

	it('should parse arrays (`ignoreEmptyRows` not specified)', () => {
		const { rows, errors } = mapToObjects([
			[
				'NAMES'
			], [
				'Barack Obama, "String, with, colons", Donald Trump'
			], [
				null
			]
		], {
			names: {
				column: 'NAMES',
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
		const { rows, errors } = mapToObjects([
			[
				'INTEGER'
			], [
				'1'
			], [
				'1.2'
			]
		], {
			value: {
				column: 'INTEGER',
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
		}, null])
	})

	it('should parse URLs', () =>
	{
		const { rows, errors } = mapToObjects([
			[
				'URL'
			], [
				'https://kremlin.ru'
			], [
				'kremlin.ru'
			]
		], {
			value: {
				column: 'URL',
				type: URL
			}
		})

		errors.length.should.equal(1)
		errors[0].row.should.equal(3)
		errors[0].column.should.equal('URL')
		errors[0].error.should.equal('invalid')

		rows.should.deep.equal([{
			value: 'https://kremlin.ru'
		}, null])
	})

	it('should parse Emails', () =>
	{
		const { rows, errors } = mapToObjects([
			[
				'EMAIL'
			], [
				'vladimir.putin@kremlin.ru'
			], [
				'123'
			]
		], {
			value: {
				column: 'EMAIL',
				type: Email
			}
		})

		errors.length.should.equal(1)
		errors[0].row.should.equal(3)
		errors[0].column.should.equal('EMAIL')
		errors[0].error.should.equal('invalid')

		rows.should.deep.equal([{
			value: 'vladimir.putin@kremlin.ru'
		}, null])
	})

	it('should call .validate()', () => {
		const { rows, errors } = mapToObjects([
			[
				'NAME'
			], [
				'George Bush'
			]
		], {
			name: {
				column: 'NAME',
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

		rows.should.deep.equal([null])
	})

	it('should validate numbers', () => {
		const { rows, errors } = mapToObjects([
			[
				'NUMBER'
			], [
				'123abc'
			]
		], {
			number: {
				column: 'NUMBER',
				type: Number,
				required: true
			}
		})

		errors.should.deep.equal([{
			error: 'invalid',
			reason: 'not_a_number',
			row: 2,
			column: 'NUMBER',
			type: Number,
			value: '123abc'
		}])

		rows.should.deep.equal([null])
	})

	it('should validate booleans', () => {
		const { rows, errors } = mapToObjects([
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
			true: {
				column: 'TRUE',
				type: Boolean,
				required: true
			},
			false: {
				column: 'FALSE',
				type: Boolean,
				required: true
			},
			invalid: {
				column: 'INVALID',
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
		const { rows, errors } = mapToObjects([
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
			date: {
				column: 'DATE',
				type: Date,
				required: true
			},
			invalid: {
				column: 'INVALID',
				type: Date,
				required: true
			}
		})

		errors.should.deep.equal([{
			error: 'invalid',
			reason: 'not_a_date',
			row: 2,
			column: 'INVALID',
			type: Date,
			value: '-'
		}, {
			error: 'invalid',
			reason: 'not_a_date',
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
		const type = () => {
			throw new Error('invalid')
		}

		const { rows, errors } = mapToObjects([
			[
				'PHONE',
				'PHONE_TYPE'
			], [
				'123',
				'123'
			]
		], {
			phone: {
				column: 'PHONE',
				type
			},
			phoneType: {
				column: 'PHONE_TYPE',
				type
			}
		})

		errors.should.deep.equal([{
			error: 'invalid',
			row: 2,
			column: 'PHONE',
			value: '123',
			type
		}, {
			error: 'invalid',
			row: 2,
			column: 'PHONE_TYPE',
			value: '123',
			type
		}])

		rows.should.deep.equal([null])
	})

	it('should map row numbers', () => {
		const { rows, errors } = mapToObjects([
			[
				'NUMBER'
			], [
				'123abc'
			]
		], {
			number: {
				column: 'NUMBER',
				type: Number
			}
		}, {
			rowIndexSourceMap: [2, 5]
		})

		errors.should.deep.equal([{
			error: 'invalid',
			reason: 'not_a_number',
			row: 6,
			column: 'NUMBER',
			type: Number,
			value: '123abc'
		}])
	})

	it('should validate "oneOf" (valid)', () => {
		const { rows, errors } = mapToObjects([
			[
				'STATUS'
			],
			[
				'STARTED'
			]
		], {
			status: {
				column: 'STATUS',
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
		const { rows, errors } = mapToObjects([
			[
				'STATUS'
			],
			[
				'SCHEDULED'
			]
		], {
			status: {
				column: 'STATUS',
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
		const { rows } = mapToObjects(
			[
				['A', 'B', 'CA', 'CB'],
				['a', 'b', 'ca', null],
				['a', null]
			],
			{
				a: {
					column: 'A',
					type: String
				},
				b: {
					column: 'B',
					type: String
				},
				c: {
					column: 'C',
    			schema: {
						a: {
							column: 'CA',
							type: String
						},
						b: {
							column: 'CB',
							type: String
						}
					}
				}
			}
		)

		rows.should.deep.equal([
			{ a: 'a', b: 'b', c: { a: 'ca', b: null } },
			{ a: 'a', b: null, c: null },
		])
	})

	it('should handle missing columns / empty cells (default) (`required: false`)', () => {
		const { rows, errors } = mapToObjects([
			[
				'COLUMN_2',
				'COLUMN_3',
				'COLUMN_4'
			], [
				'12',
				'13',
				'14'
			], [
				'22',
				'23',
				null
			]
		], {
			column1: {
				column: 'COLUMN_1',
				type: String,
				required: false
			},
			column2: {
				column: 'COLUMN_2',
				type: String,
				required: false
			},
			column4: {
				column: 'COLUMN_4',
				type: String,
				required: false
			},
			column5: {
				column: 'COLUMN_5',
				type: String,
				required: false
			}
		})

		errors.should.deep.equal([])

		// Legacy behavior.
		rows.should.deep.equal([{
			column2: '12',
			column4: '14'
		}, {
			column2: '22',
			column4: null
		}])
	})

	it('should handle missing columns / empty cells (`schemaPropertyValueForMissingColumn: null`) (`required: false`)', () => {
		const { rows, errors } = mapToObjects([
			[
				'COLUMN_2',
				'COLUMN_3',
				'COLUMN_4'
			], [
				'12',
				'13',
				'14'
			], [
				'22',
				'23',
				null
			]
		], {
			column1: {
				column: 'COLUMN_1',
				type: String,
				required: false
			},
			column2: {
				column: 'COLUMN_2',
				type: String,
				required: false
			},
			column4: {
				column: 'COLUMN_4',
				type: String,
				required: false
			},
			column5: {
				column: 'COLUMN_5',
				type: String,
				required: false
			}
		}, {
			schemaPropertyValueForMissingColumn: null
		})

		errors.should.deep.equal([])

		rows.should.deep.equal([{
			column1: null,
			column2: '12',
			column4: '14',
			column5: null
		}, {
			column1: null,
			column2: '22',
			column4: null,
			column5: null
		}])
	})

	it('should handle missing columns / empty cells (`schemaPropertyValueForMissingValue` option is not passed) (`required: false`)', () => {
		const { rows, errors } = mapToObjects([
			[
				'COLUMN_2',
				'COLUMN_3',
				'COLUMN_4'
			], [
				'12',
				'13',
				'14'
			], [
				'22',
				'23',
				null
			]
		], {
			column1: {
				column: 'COLUMN_1',
				type: String,
				required: false
			},
			column2: {
				column: 'COLUMN_2',
				type: String,
				required: false
			},
			column4: {
				column: 'COLUMN_4',
				type: String,
				required: false
			},
			column5: {
				column: 'COLUMN_5',
				type: String,
				required: false
			}
		})

		errors.should.deep.equal([])

		rows.should.deep.equal([{
			// column1: undefined,
			column2: '12',
			column4: '14',
			// column5: undefined
		}, {
			// column1: undefined,
			column2: '22',
			column4: null,
			// column5: undefined
		}])
	})

	it('should handle missing columns / empty cells (`schemaPropertyValueForMissingValue: undefined`) (`required: false`)', () => {
		const { rows, errors } = mapToObjects([
			[
				'COLUMN_2',
				'COLUMN_3',
				'COLUMN_4'
			], [
				'12',
				'13',
				'14'
			], [
				'22',
				'23',
				null
			]
		], {
			column1: {
				column: 'COLUMN_1',
				type: String,
				required: false
			},
			column2: {
				column: 'COLUMN_2',
				type: String,
				required: false
			},
			column4: {
				column: 'COLUMN_4',
				type: String,
				required: false
			},
			column5: {
				column: 'COLUMN_5',
				type: String,
				required: false
			}
		}, {
			schemaPropertyValueForMissingValue: undefined
		})

		errors.should.deep.equal([])

		rows.should.deep.equal([{
			// column1: undefined,
			column2: '12',
			column4: '14',
			// column5: undefined
		}, {
			// column1: undefined,
			column2: '22',
			// column4: undefined,
			// column5: undefined
		}])
	})

	it('should handle missing columns / empty cells (`schemaPropertyValueForMissingColumn` option is not passed) (`required: false`)', () => {
		const { rows, errors } = mapToObjects([
			[
				'COLUMN_2',
				'COLUMN_3',
				'COLUMN_4'
			], [
				'12',
				'13',
				'14'
			], [
				'22',
				'23',
				null
			]
		], {
			column1: {
				column: 'COLUMN_1',
				type: String,
				required: false
			},
			column2: {
				column: 'COLUMN_2',
				type: String,
				required: false
			},
			column4: {
				column: 'COLUMN_4',
				type: String,
				required: false
			},
			column5: {
				column: 'COLUMN_5',
				type: String,
				required: false
			}
		})

		errors.should.deep.equal([])

		rows.should.deep.equal([{
			// column1: undefined,
			column2: '12',
			column4: '14',
			// column5: undefined
		}, {
			// column1: undefined,
			column2: '22',
			column4: null,
			// column5: undefined
		}])
	})

	it('should handle missing columns / empty cells (`schemaPropertyValueForNullCellValue: null`) (`required: false`)', () => {
		const { rows, errors } = mapToObjects([
			[
				'COLUMN_2',
				'COLUMN_3',
				'COLUMN_4'
			], [
				'12',
				'13',
				'14'
			], [
				'22',
				'23',
				null
			]
		], {
			column1: {
				column: 'COLUMN_1',
				type: String,
				required: false
			},
			column2: {
				column: 'COLUMN_2',
				type: String,
				required: false
			},
			column4: {
				column: 'COLUMN_4',
				type: String,
				required: false
			},
			column5: {
				column: 'COLUMN_5',
				type: String,
				required: false
			}
		}, {
			schemaPropertyValueForNullCellValue: null
		})

		errors.should.deep.equal([])

		rows.should.deep.equal([{
			// column1: undefined,
			column2: '12',
			column4: '14',
			// column5: undefined
		}, {
			// column1: undefined,
			column2: '22',
			column4: null,
			// column5: undefined
		}])
	})

	it('should handle missing columns / empty cells (`schemaPropertyValueForMissingColumn: null` and `schemaPropertyValueForNullCellValue: null`) (`required: false`)', () => {
		const { rows, errors } = mapToObjects([
			[
				'COLUMN_2',
				'COLUMN_3',
				'COLUMN_4'
			], [
				'12',
				'13',
				'14'
			], [
				'22',
				'23',
				null
			]
		], {
			column1: {
				column: 'COLUMN_1',
				type: String,
				required: false
			},
			column2: {
				column: 'COLUMN_2',
				type: String,
				required: false
			},
			column4: {
				column: 'COLUMN_4',
				type: String,
				required: false
			},
			column5: {
				column: 'COLUMN_5',
				type: String,
				required: false
			}
		}, {
			schemaPropertyValueForMissingColumn: null,
			schemaPropertyValueForNullCellValue: null
		})

		errors.should.deep.equal([])

		rows.should.deep.equal([{
			column1: null,
			column2: '12',
			column4: '14',
			column5: null
		}, {
			column1: null,
			column2: '22',
			column4: null,
			column5: null
		}])
	})

	it('should handle missing columns / empty cells (`schemaPropertyValueForMissingColumn: null` and `schemaPropertyValueForNullCellValue: null` and `schemaPropertyShouldSkipRequiredValidationForMissingColumn()` not specified) (`required: true`)', () => {
		const { rows, errors } = mapToObjects([
			[
				'COLUMN_2',
				'COLUMN_3',
				'COLUMN_4'
			], [
				'12',
				'13',
				'14'
			], [
				'22',
				'23',
				null
			]
		], {
			column1: {
				column: 'COLUMN_1',
				type: String,
				required: false
			},
			column2: {
				column: 'COLUMN_2',
				type: String,
				required: false
			},
			column4: {
				column: 'COLUMN_4',
				type: String,
				required: false
			},
			column5: {
				column: 'COLUMN_5',
				type: String,
				required: true
			}
		}, {
			schemaPropertyValueForMissingColumn: null,
			schemaPropertyValueForNullCellValue: null
		})

		errors.should.deep.equal([{
			column: 'COLUMN_5',
			error: 'required',
			row: 2,
			type: String,
			value: null
		}, {
			column: 'COLUMN_5',
			error: 'required',
			row: 3,
			type: String,
			value: null
		}])

		rows.should.deep.equal([{
			column1: null,
			column2: '12',
			column4: '14',
			column5: null
		}, {
			column1: null,
			column2: '22',
			column4: null,
			column5: null
		}])
	})

	it('should handle missing columns / empty cells (`schemaPropertyValueForMissingColumn: null` and `schemaPropertyValueForNullCellValue: null` and `schemaPropertyShouldSkipRequiredValidationForMissingColumn: () => false`) (`required: true`)', () => {
		const { rows, errors } = mapToObjects([
			[
				'COLUMN_2',
				'COLUMN_3',
				'COLUMN_4'
			], [
				'12',
				'13',
				'14'
			], [
				'22',
				'23',
				null
			]
		], {
			column1: {
				column: 'COLUMN_1',
				type: String,
				required: false
			},
			column2: {
				column: 'COLUMN_2',
				type: String,
				required: false
			},
			column4: {
				column: 'COLUMN_4',
				type: String,
				required: false
			},
			column5: {
				column: 'COLUMN_5',
				type: String,
				required: true
			}
		}, {
			schemaPropertyValueForMissingColumn: null,
			schemaPropertyValueForNullCellValue: null,
			schemaPropertyShouldSkipRequiredValidationForMissingColumn: () => false
		})

		errors.should.deep.equal([{
			column: 'COLUMN_5',
			error: 'required',
			row: 2,
			type: String,
			value: null
		}, {
			column: 'COLUMN_5',
			error: 'required',
			row: 3,
			type: String,
			value: null
		}])

		rows.should.deep.equal([{
			column1: null,
			column2: '12',
			column4: '14',
			column5: null
		}, {
			column1: null,
			column2: '22',
			column4: null,
			column5: null
		}])
	})

	it('should handle missing columns / empty cells (`schemaPropertyValueForMissingColumn: null` and `schemaPropertyValueForNullCellValue: null` and `schemaPropertyShouldSkipRequiredValidationForMissingColumn: () => true`) (`required: true`)', () => {
		const { rows, errors } = mapToObjects([
			[
				'COLUMN_2',
				'COLUMN_3',
				'COLUMN_4'
			], [
				'12',
				'13',
				'14'
			], [
				'22',
				'23',
				null
			]
		], {
			column1: {
				column: 'COLUMN_1',
				type: String,
				required: false
			},
			column2: {
				column: 'COLUMN_2',
				type: String,
				required: false
			},
			column4: {
				column: 'COLUMN_4',
				type: String,
				required: false
			},
			column5: {
				column: 'COLUMN_5',
				type: String,
				required: true
			}
		}, {
			schemaPropertyValueForMissingColumn: null,
			schemaPropertyValueForNullCellValue: null,
			schemaPropertyShouldSkipRequiredValidationForMissingColumn: () => true
		})

		errors.should.deep.equal([])

		rows.should.deep.equal([{
			column1: null,
			column2: '12',
			column4: '14',
			column5: null
		}, {
			column1: null,
			column2: '22',
			column4: null,
			column5: null
		}])
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
