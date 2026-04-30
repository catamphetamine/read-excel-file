import { describe, it } from 'mocha'
import { expect } from 'chai'

import readSheet from '../../source/export/readSheetNode.js'

describe('schema', () => {
	it('should parse objects from sheet data when `schema` parameter is passed (returns `objects`)', async () => {
		const schema = {
			name: {
				column: 'Name'
			},
			dateOfBirth: {
				column: 'Date of Birth',
				type: Date
			},
			income: {
				column: 'Income',
				type: Number
			},
			married: {
				column: 'Married',
				type: Boolean
			}
		}

		const { objects, errors } = await readSheet('./test/testCases/schema.xlsx', { schema })

		expect(errors).to.be.undefined

		expect(objects).to.deep.equal([
			{
				name: 'John Smith',
				dateOfBirth: new Date(Date.UTC(2000, 1 - 1, 5)),
				income: 120000,
				married: true
			},
			{
				name: 'Alice Brown',
				dateOfBirth: new Date(Date.UTC(2005, 4 - 1, 3)),
				income: 60000,
				married: false
			}
		])
	})

	it('should parse objects from sheet data when `schema` parameter is passed (returns `errors`)', async () => {
		const schema = {
			name: {
				column: 'Absent Column',
				required: true
			},
			dateOfBirth: {
				column: 'Date of Birth',
				type: Date
			},
			income: {
				column: 'Income',
				type: Number
			},
			married: {
				column: 'Married',
				type: Boolean
			}
		}

		const { objects, errors } = await readSheet('./test/testCases/schema.xlsx', { schema })

		expect(objects).to.be.undefined

		expect(errors).to.deep.equal([
			{
				error: 'required',
				row: 1,
				columnIndex: -1,
				column: 'Absent Column',
				value: undefined
			},
			{
				error: 'required',
				row: 2,
				columnIndex: -1,
				column: 'Absent Column',
				value: undefined
			}
		])
	})
})