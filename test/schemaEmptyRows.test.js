import path from 'path'

import readXlsx from '../source/read/readXlsxFileNode.js'

describe('read-excel-file', function() {
	it('should ignore empty rows by default when parsing data with a `schema`', async function() {
		const rowIndexSourceMap = []
		const { rows, errors } = await readXlsx(path.resolve('./test/spreadsheets/schemaEmptyRows.xlsx'), { schema, rowIndexSourceMap })
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
		rowIndexSourceMap.should.deep.equal([0, 1, 2, 3])
	})

	it('should ignore empty rows by default (throws error)', async function() {
		const rowIndexSourceMap = []
		const { rows, errors } = await readXlsx(path.resolve('./test/spreadsheets/schemaEmptyRows.xlsx'), { schema: schemaWithIncorrectContactColumnType, rowIndexSourceMap })
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
		rowIndexSourceMap.should.deep.equal([0, 1, 2, 3])
	})

	/*
	it('should not ignore empty rows when `ignoreEmptyRows: false` flag is passed (validates `rows` output property)', async function() {
		const rowIndexSourceMap = []
		const { rows, errors } = await readXlsx(path.resolve('./test/spreadsheets/schemaEmptyRows.xlsx'), { schema, rowIndexSourceMap, ignoreEmptyRows: false })
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
		rowIndexSourceMap.should.deep.equal([0, 1, 2, 3])
	})

	it('should not ignore empty rows when `ignoreEmptyRows: false` flag is passed (validates `errors` output property)', async function() {
		const rowIndexSourceMap = []
		const { rows, errors } = await readXlsx(path.resolve('./test/spreadsheets/schemaEmptyRows.xlsx'), { schema: schemaWithIncorrectContactColumnType, rowIndexSourceMap })
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
		rowIndexSourceMap.should.deep.equal([0, 1, 2, 3])
	})
	*/
})

const schema = {
	date: {
		column: 'START DATE',
		type: Date
	},
	numberOfStudents: {
		column: 'NUMBER OF STUDENTS',
		type: Number
	},
	course: {
		schema: {
			isFree: {
				column: 'IS FREE',
				type: Boolean
				// Excel stored booleans as numbers:
				// `1` is `true` and `0` is `false`.
				// Such numbers are parsed to booleans.
			},
			cost: {
				column: 'COST',
				type: Number
			},
			title: {
				column: 'COURSE TITLE',
				type: String
			}
		}
	},
	contact: {
		column: 'CONTACT',
		type(value) {
			return '+11234567890'
		}
	}
}

const schemaWithIncorrectContactColumnType = {
	...schema,
	contact: {
		column: 'CONTACT',
		type: Boolean
	}
}