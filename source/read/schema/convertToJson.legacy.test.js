import convertToJson from './convertToJson.legacy.js'

import Integer from '../../types/Integer.js'

describe('convertToJson (legacy behavior)', () => {
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

	it('should handle missing columns / empty cells (default) (`required: false`)', () => {
		const { rows, errors } = convertToJson([
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
			COLUMN_1: {
				prop: 'column1',
				type: String,
				required: false
			},
			COLUMN_2: {
				prop: 'column2',
				type: String,
				required: false
			},
			COLUMN_4: {
				prop: 'column4',
				type: String,
				required: false
			},
			COLUMN_5: {
				prop: 'column5',
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
			column2: '22'
		}])
	})

	it('should handle missing columns / empty cells (`includeNullValues: true`) (`required: false`)', () => {
		const { rows, errors } = convertToJson([
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
			COLUMN_1: {
				prop: 'column1',
				type: String,
				required: false
			},
			COLUMN_2: {
				prop: 'column2',
				type: String,
				required: false
			},
			COLUMN_4: {
				prop: 'column4',
				type: String,
				required: false
			},
			COLUMN_5: {
				prop: 'column5',
				type: String,
				required: false
			}
		}, {
			includeNullValues: true
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

	it('should require fields when cell value is empty', () => {
		const { rows, errors } = convertToJson([
			[
				'NUMBER',
				'STRING'
			],
			[
				null,
				'abc'
			]
		], {
			NUMBER: {
				prop: 'number',
				type: Number,
				required: true
			},
			STRING: {
				prop: 'string',
				type: String,
				required: true
			}
		})

		errors.should.deep.equal([{
			error: 'required',
			row: 2,
			column: 'NUMBER',
			type: Number,
			// value: null,
			value: undefined
		}])

		rows.should.deep.equal([{
			string: 'abc'
		}])
	})

	it('shouldn\'t require fields when cell value is empty and object is empty too', () => {
		const { rows, errors } = convertToJson([
			[
				'NUMBER'
			],
			[
				null
			]
		], {
			NUMBER: {
				prop: 'number',
				type: Number,
				required: true
			}
		})

		rows.should.deep.equal([])
	})

	it('should parse arrays (and remove `null` empty objects from result)', () => {
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

	it('should parse integers (and drop `null` errored objects from result)', () =>
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

	it('should not include `null` values by default (and set `null` for an "empty" object)', function() {
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
})