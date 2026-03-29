import { describe, it } from 'mocha'
import { expect } from 'chai'

import path from 'path'

import readSheet from '../../source/export/readSheetNode.js'
import parseData from '../../source/parseData/parseData.js'

describe('read-excel-file', function() {
	it('should not ignore empty rows when parsing data with a `schema`', async function() {
		// const rowIndexSourceMap = []

		const data = await readSheet(path.resolve('./test/testCases/schemaEmptyRows.xlsx'))

		const result = parseData(data, schema) // { rowIndexSourceMap }

		expect(result.length).to.equal(3)

		expect(result[0].errors).to.be.undefined
		expect(result[0].object).to.exist

		expect(result[1].errors).to.be.undefined
		expect(result[1].object).to.equal(null)

		expect(result[2].errors).to.be.undefined
		expect(result[2].object).to.exist

		expect(result[0].object).to.deep.equal({
			date: new Date(Date.UTC(2018, 3 - 1, 24)),
			numberOfStudents: 123,
			course: {
				isFree: false,
				cost: 210.45,
				title: 'Chemistry'
			},
			contact: '+11234567890'
		})

		expect(result[1].object).to.equal(null)

		expect(result[2].object).to.deep.equal({
			date: new Date(Date.UTC(2018, 3 - 1, 24)),
			numberOfStudents: 123,
			course: {
				isFree: false,
				cost: 210.45,
				title: 'Chemistry'
			},
			contact: '+11234567890'
		})

		// expect(rowIndexSourceMap).to.deep.equal([0, 1, 2, 3])
	})

	it('should not ignore empty rows (has errors during parsing)', async function() {
		// const rowIndexSourceMap = []

		const data = await readSheet(path.resolve('./test/testCases/schemaEmptyRows.xlsx'))

		const result = parseData(data, schemaWithIncorrectContactColumnType) // { rowIndexSourceMap }

		expect(result.length).to.equal(3)

		expect(result[0].errors).to.exist
		expect(result[0].errors.length).to.equal(1)
		expect(result[0].object).to.be.undefined

		expect(result[1].errors).to.be.undefined
		expect(result[1].object).to.equal(null)

		expect(result[2].errors).to.exist
		expect(result[2].errors.length).to.equal(1)
		expect(result[2].object).to.be.undefined

		expect(result[0].errors).to.deep.equal([{
			error: 'invalid',
			reason: 'not_a_boolean',
			value: '(123) 456-7890',
			// row: 2,
			column: 'CONTACT',
			type: Boolean
		}])

		expect(result[1].object).to.equal(null)

		expect(result[2].errors).to.deep.equal([{
			error: 'invalid',
			reason: 'not_a_boolean',
			value: '(123) 456-7890',
			// row: 4,
			column: 'CONTACT',
			type: Boolean
		}])

		// expect(rowIndexSourceMap).to.deep.equal([0, 1, 2, 3])
	})
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