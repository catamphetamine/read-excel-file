import { describe, it } from 'mocha'
import { expect } from 'chai'

import parseData, { parseSeparatedSubstrings, getNextSubstring } from './parseData.js'

// Additional included types.
import Integer from './types/additional/Integer.js'
import URL from './types/additional/URL.js'
import Email from './types/additional/Email.js'

const date = new Date(Date.UTC(2018, 3 - 1, 24))

describe('parseData', () => {
	it('should parse arrays', () => {
		expect(getNextSubstring('abcde,fg,h', ',', 0)).to.deep.equal(['abcde', 5])

		// Custom separator and trimming.
		expect(parseSeparatedSubstrings(' abcde,fg  , h ', ',')).to.deep.equal(['abcde', 'fg', 'h'])

		// Should ignore commas inside quotes.
		// expect(getNextSubstring('abc"de,f"g,h', ',', 0)).to.deep.equal(['abcde,fg', 10])

		// Custom separator and trimming.
		// Should ignore commas inside quotes.
		// expect(parseSeparatedSubstrings(' abc"de,f"g  , h ', ',')).to.deep.equal(['abcde,fg', 'h'])
	})

	it('should convert to json', () => {
		const results = parseData([
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

		expect(results.length).to.equal(1)

		expect(results[0].object).to.exist
		expect(results[0].errors).to.be.undefined

		expect(results[0].object).to.deep.equal({
			date: date,
			number: 123,
			phone: '+11234567890',
			phoneType: '+11234567890',
			boolean: true,
			string: 'abc'
		})
	})

	it('should support schema entries with no `type`s', () => {
		const results = parseData([
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

		expect(results.length).to.equal(1)

		expect(results[0].object).to.exist
		expect(results[0].errors).to.be.undefined

		expect(results[0].object).to.deep.equal({
			date: date,
			number: 123,
			boolean: true,
			string: 'abc'
		})
	})

	it('should require fields when cell value is empty', () => {
		const results = parseData([
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

		expect(results.length).to.equal(1)

		expect(results[0].object).to.be.undefined

		expect(results[0].errors).to.deep.equal([{
			error: 'required',
			// row: 2,
			column: 'NUMBER',
			type: Number,
			value: null
		}])
	})

	// it('shouldn\'t require fields when cell value is empty and object is empty too (`ignoreEmptyRows: false`', () => {
	// 	const results = parseData([
	// 		[
	// 			'NUMBER'
	// 		],
	// 		[
	// 			null
	// 		]
	// 	], {
	// 		number: {
	// 			column: 'NUMBER',
	// 			type: Number,
	// 			required: true
	// 		}
	// 	}, {
	// 		ignoreEmptyRows: false
	// 	})
	//
	// 	expect(results.length).to.equal(1)
	//
	// 	expect(results[0].object).to.exist
	// 	expect(results[0].errors).to.be.undefined
	//
	// 	expect(results[0].object).to.deep.equal(null)
	// })

	// it('shouldn\'t require fields when cell value is empty but the top-level object itself is empty too', () => {
	// 	const results = parseData([
	// 		[
	// 			'NUMBER'
	// 		],
	// 		[
	// 			null
	// 		]
	// 	], {
	// 		number: {
	// 			column: 'NUMBER',
	// 			type: Number,
	// 			required: true
	// 		}
	// 	})
	//
	// 	expect(results.length).to.equal(1)
	//
	// 	console.log(results[0])
	//
	// 	expect(results[0].object).to.exist
	// 	expect(results[0].errors).to.be.undefined
	//
	// 	expect(results[0].object).to.deep.equal(null)
	// })

	// it('should parse arrays (`ignoreEmptyRows: false`)', () => {
	// 	const { rows, errors } = parseData([
	// 		[
	// 			'NAMES'
	// 		], [
	// 			'Barack Obama, "String, with, colons", Donald Trump'
	// 		], [
	// 			null
	// 		]
	// 	], {
	// 		names: {
	// 			column: 'NAMES',
	// 			type: [String]
	// 		}
	// 	}, {
	// 		ignoreEmptyRows: false
	// 	})
	//
	// 	expect(errors).to.deep.equal([])
	//
	// 	expect(rows).to.deep.equal([{
	// 		names: ['Barack Obama', 'String, with, colons', 'Donald Trump']
	// 	}, null])
	// })

	it('should parse arrays', () => {
		const results = parseData([
			[
				'NAMES'
			], [
				// 'Barack Obama, "String, with, colons", Donald Trump'
				'Barack Obama, String, Donald Trump'
			], [
				', String'
			], [
				null
			]
		], {
			names: {
				column: 'NAMES',
				type: [String]
			}
		})

		expect(results.length).to.equal(3)

		expect(results[0].object).to.exist
		expect(results[0].errors).to.be.undefined

		expect(results[0].object).to.deep.equal({
			// names: ['Barack Obama', 'String, with, colons', 'Donald Trump']
			names: ['Barack Obama', 'String', 'Donald Trump']
		})

		expect(results[1].object).to.be.undefined
		expect(results[1].errors).to.exist

		expect(results[1].errors).to.deep.equal([{
			error: 'invalid',
			reason: 'syntax',
			column: 'NAMES',
			value: ', String',
			type: [String]
		}])

		expect(results[2].object).to.deep.equal(null)
		expect(results[2].errors).to.be.undefined
	})

	it('should parse integers', () => {
		const results = parseData([
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

		expect(results.length).to.equal(2)

		expect(results[0].object).to.exist
		expect(results[0].errors).to.be.undefined

		expect(results[0].object).to.deep.equal({
			value: 1
		})

		expect(results[1].object).to.be.undefined
		expect(results[1].errors).to.exist
		expect(results[1].errors.length).to.equal(1)

		expect(results[1].errors).to.deep.equal([{
			error: 'invalid',
			reason: 'not_an_integer',
			// row: 3,
			column: 'INTEGER',
			type: Integer,
			value: '1.2'
		}])
	})

	it('should parse URLs', () => {
		const results = parseData([
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

		expect(results.length).to.equal(2)

		expect(results[0].object).to.exist
		expect(results[0].errors).to.be.undefined

		expect(results[0].object).to.deep.equal({
			value: 'https://kremlin.ru'
		})

		expect(results[1].object).to.be.undefined
		expect(results[1].errors).to.exist
		expect(results[1].errors.length).to.equal(1)

		expect(results[1].errors).to.deep.equal([{
			error: 'invalid',
			reason: 'not_a_url',
			// row: 3,
			column: 'URL',
			type: URL,
			value: 'kremlin.ru'
		}])
	})

	it('should parse Emails', () => {
		const results = parseData([
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

		expect(results.length).to.equal(2)

		expect(results[0].object).to.exist
		expect(results[0].errors).to.be.undefined

		expect(results[0].object).to.deep.equal({
			value: 'vladimir.putin@kremlin.ru'
		})

		expect(results[1].object).to.be.undefined
		expect(results[1].errors).to.exist
		expect(results[1].errors.length).to.equal(1)

		expect(results[1].errors).to.deep.equal([{
			error: 'invalid',
			reason: 'not_an_email',
			// row: 3,
			column: 'EMAIL',
			type: Email,
			value: '123'
		}])
	})

	it('should call .validate()', () => {
		const results = parseData([
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

		expect(results.length).to.equal(1)

		expect(results[0].object).to.be.undefined
		expect(results[0].errors).to.exist

		expect(results[0].errors).to.deep.equal([{
			error: 'custom-error',
			// row: 2,
			column: 'NAME',
			type: String,
			value: 'George Bush'
		}])
	})

	it('should validate numbers', () => {
		const results = parseData([
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

		expect(results.length).to.equal(1)

		expect(results[0].object).to.be.undefined
		expect(results[0].errors).to.exist

		expect(results[0].errors).to.deep.equal([{
			error: 'invalid',
			reason: 'not_a_number',
			// row: 2,
			column: 'NUMBER',
			type: Number,
			value: '123abc'
		}])
	})

	it('should validate booleans', () => {
		const results = parseData([
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

		expect(results.length).to.equal(1)

		expect(results[0].object).to.be.undefined
		expect(results[0].errors).to.exist

		expect(results[0].errors).to.deep.equal([{
			error: 'invalid',
			reason: 'not_a_boolean',
			// row: 2,
			column: 'INVALID',
			type: Boolean,
			value: 'TRUE'
		}])
	})

	it('should validate dates', () => {
		const results = parseData([
			[
				'DATE',
				'INVALID'
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

		expect(results.length).to.equal(1)

		expect(results[0].object).to.be.undefined
		expect(results[0].errors).to.exist

		expect(results[0].errors).to.deep.equal([{
			error: 'invalid',
			reason: 'not_a_date',
			// row: 2,
			column: 'INVALID',
			type: Date,
			value: '-'
		}])
	})

	it('should throw parse() errors', () => {
		const type = () => {
			throw new Error('invalid')
		}

		const results = parseData([
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

		expect(results.length).to.equal(1)

		expect(results[0].object).to.be.undefined
		expect(results[0].errors).to.exist

		expect(results[0].errors).to.deep.equal([{
			error: 'invalid',
			// row: 2,
			column: 'PHONE',
			value: '123',
			type
		}, {
			error: 'invalid',
			// row: 2,
			column: 'PHONE_TYPE',
			value: '123',
			type
		}])
	})

	it('should map row numbers', () => {
		const results = parseData([
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
		})

		// , { rowIndexSourceMap: [2, 5] })

		expect(results.length).to.equal(1)

		expect(results[0].object).to.be.undefined
		expect(results[0].errors).to.exist

		expect(results[0].errors).to.deep.equal([{
			error: 'invalid',
			reason: 'not_a_number',
			// row: 6,
			column: 'NUMBER',
			type: Number,
			value: '123abc'
		}])
	})

	it('should validate "oneOf" (valid)', () => {
		const results = parseData([
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

		expect(results.length).to.equal(1)

		expect(results[0].object).to.exist
		expect(results[0].errors).to.be.undefined

		expect(results[0].object).to.deep.equal({
			status: 'STARTED'
		})
	})

	it('should validate "oneOf" (not valid)', () => {
		const results = parseData([
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

		expect(results.length).to.equal(1)

		expect(results[0].object).to.be.undefined
		expect(results[0].errors).to.exist

		expect(results[0].errors).to.deep.equal([{
			error: 'invalid',
			reason: 'unknown',
			// row: 2,
			column: 'STATUS',
			type: String,
			value: 'SCHEDULED'
		}])
	})

	it('should reduce empty objects to `null` by default', function() {
		const results = parseData(
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

		expect(results.length).to.equal(2)

		expect(results[0].object).to.exist
		expect(results[0].errors).to.be.undefined

		expect(results[0].object).to.deep.equal(
			{ a: 'a', b: 'b', c: { a: 'ca', b: null } }
		)

		expect(results[1].object).to.exist
		expect(results[1].errors).to.be.undefined

		expect(results[1].object).to.deep.equal(
			{ a: 'a', b: null, c: null }
		)
	})

	it('should parse missing columns (`undefined` by default) and empty cells (`null` by default) (`required: false`)', () => {
		const results = parseData([
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

		expect(results.length).to.equal(2)

		expect(results[0].object).to.exist
		expect(results[0].errors).to.be.undefined

		expect(results[0].object).to.deep.equal({
			column1: undefined,
			column2: '12',
			column4: '14',
			column5: undefined
		})

		expect(results[1].object).to.exist
		expect(results[1].errors).to.be.undefined

		expect(results[1].object).to.deep.equal({
			column1: undefined,
			column2: '22',
			column4: null,
			column5: undefined
		})
	})

	it('should parse missing columns (`undefined` by default) and empty cells (`null` by default) (`propertyValueWhenColumnIsMissing: null`) (`required: false`)', () => {
		const results = parseData([
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
			propertyValueWhenColumnIsMissing: null
		})

		expect(results.length).to.equal(2)

		expect(results[0].object).to.exist
		expect(results[0].errors).to.be.undefined

		expect(results[0].object).to.deep.equal({
			column1: null,
			column2: '12',
			column4: '14',
			column5: null
		})

		expect(results[1].object).to.exist
		expect(results[1].errors).to.be.undefined

		expect(results[1].object).to.deep.equal({
			column1: null,
			column2: '22',
			column4: null,
			column5: null
		})
	})

	it('should parse missing columns (`undefined` by default) and empty cells (`null` by default) (`propertyValueWhenCellIsEmpty: undefined`) (`required: false`)', () => {
		const results = parseData([
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
			propertyValueWhenCellIsEmpty: undefined
		})

		expect(results.length).to.equal(2)

		expect(results[0].object).to.exist
		expect(results[0].errors).to.be.undefined

		expect(results[0].object).to.deep.equal({
			column1: undefined,
			column2: '12',
			column4: '14',
			column5: undefined
		})

		expect(results[1].object).to.exist
		expect(results[1].errors).to.be.undefined

		expect(results[1].object).to.deep.equal({
			column1: undefined,
			column2: '22',
			column4: undefined,
			column5: undefined
		})
	})

	it('should parse missing columns (`undefined` by default) and empty cells (`null` by default) (`propertyValueWhenColumnIsMissing: null` and `propertyValueWhenCellIsEmpty: null`) (`required: false`)', () => {
		const results = parseData([
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
			propertyValueWhenColumnIsMissing: null,
			propertyValueWhenCellIsEmpty: null
		})

		expect(results.length).to.equal(2)

		expect(results[0].object).to.exist
		expect(results[0].errors).to.be.undefined

		expect(results[0].object).to.deep.equal({
			column1: null,
			column2: '12',
			column4: '14',
			column5: null
		})

		expect(results[1].object).to.exist
		expect(results[1].errors).to.be.undefined

		expect(results[1].object).to.deep.equal({
			column1: null,
			column2: '22',
			column4: null,
			column5: null
		})
	})

	it('should parse missing columns (`undefined` by default) and empty cells (`null` by default) (`propertyValueWhenColumnIsMissing: null` and `propertyValueWhenCellIsEmpty: null`) (`required: true`)', () => {
		const results = parseData([
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
			propertyValueWhenColumnIsMissing: null,
			propertyValueWhenCellIsEmpty: null
		})

		expect(results.length).to.equal(2)

		expect(results[0].object).to.be.undefined
		expect(results[0].errors).to.exist

		expect(results[0].errors).to.deep.equal([{
			column: 'COLUMN_5',
			error: 'required',
			// row: 2,
			type: String,
			value: null
		}])

		expect(results[1].object).to.be.undefined
		expect(results[1].errors).to.exist

		expect(results[1].errors).to.deep.equal([{
			column: 'COLUMN_5',
			error: 'required',
			// row: 3,
			type: String,
			value: null
		}])
	})

	// it('should handle missing columns / empty cells (`propertyValueWhenColumnIsMissing: null` and `propertyValueWhenCellIsEmpty: null` and `shouldSkipRequiredValidationWhenColumnIsMissing: () => false`) (`required: true`)', () => {
	// 	const { rows, errors } = parseData([
	// 		[
	// 			'COLUMN_2',
	// 			'COLUMN_3',
	// 			'COLUMN_4'
	// 		], [
	// 			'12',
	// 			'13',
	// 			'14'
	// 		], [
	// 			'22',
	// 			'23',
	// 			null
	// 		]
	// 	], {
	// 		column1: {
	// 			column: 'COLUMN_1',
	// 			type: String,
	// 			required: false
	// 		},
	// 		column2: {
	// 			column: 'COLUMN_2',
	// 			type: String,
	// 			required: false
	// 		},
	// 		column4: {
	// 			column: 'COLUMN_4',
	// 			type: String,
	// 			required: false
	// 		},
	// 		column5: {
	// 			column: 'COLUMN_5',
	// 			type: String,
	// 			required: true
	// 		}
	// 	}, {
	// 		propertyValueWhenColumnIsMissing: null,
	// 		propertyValueWhenCellIsEmpty: null,
	// 		shouldSkipRequiredValidationWhenColumnIsMissing: () => false
	// 	})
	//
	// 	expect(errors).to.deep.equal([{
	// 		column: 'COLUMN_5',
	// 		error: 'required',
	// 		row: 2,
	// 		type: String,
	// 		value: null
	// 	}, {
	// 		column: 'COLUMN_5',
	// 		error: 'required',
	// 		row: 3,
	// 		type: String,
	// 		value: null
	// 	}])
	//
	// 	expect(rows).to.deep.equal([{
	// 		column1: null,
	// 		column2: '12',
	// 		column4: '14',
	// 		column5: null
	// 	}, {
	// 		column1: null,
	// 		column2: '22',
	// 		column4: null,
	// 		column5: null
	// 	}])
	// })

	// it('should handle missing columns / empty cells (`propertyValueWhenColumnIsMissing: null` and `propertyValueWhenCellIsEmpty: null` and `shouldSkipRequiredValidationWhenColumnIsMissing: () => true`) (`required: true`)', () => {
	// 	const { rows, errors } = parseData([
	// 		[
	// 			'COLUMN_2',
	// 			'COLUMN_3',
	// 			'COLUMN_4'
	// 		], [
	// 			'12',
	// 			'13',
	// 			'14'
	// 		], [
	// 			'22',
	// 			'23',
	// 			null
	// 		]
	// 	], {
	// 		column1: {
	// 			column: 'COLUMN_1',
	// 			type: String,
	// 			required: false
	// 		},
	// 		column2: {
	// 			column: 'COLUMN_2',
	// 			type: String,
	// 			required: false
	// 		},
	// 		column4: {
	// 			column: 'COLUMN_4',
	// 			type: String,
	// 			required: false
	// 		},
	// 		column5: {
	// 			column: 'COLUMN_5',
	// 			type: String,
	// 			required: true
	// 		}
	// 	}, {
	// 		propertyValueWhenColumnIsMissing: null,
	// 		propertyValueWhenCellIsEmpty: null,
	// 		shouldSkipRequiredValidationWhenColumnIsMissing: () => true
	// 	})
	//
	// 	expect(errors).to.deep.equal([])
	//
	// 	expect(rows).to.deep.equal([{
	// 		column1: null,
	// 		column2: '12',
	// 		column4: '14',
	// 		column5: null
	// 	}, {
	// 		column1: null,
	// 		column2: '22',
	// 		column4: null,
	// 		column5: null
	// 	}])
	// })
})