import { describe, it } from 'mocha'
import { expect } from 'chai'

import path from 'path'

import readSheet from '../../source/export/readSheetNode.js'
import parseData from '../../source/parseData/parseData.js'

describe('read-excel-file', () => {
	it('should support `required` function (returns `true`)', async () => {
		const schema = {
			courseTitle: {
				column: 'COURSE TITLE',
				type: String
			},
			notExists: {
				column: 'NOT EXISTS',
				type: Number,
				required: (row) => row.courseTitle === 'Chemistry'
			}
		}

		const data = await readSheet(path.resolve('./test/testCases/schema-with-required-function.xlsx'))

		const results = parseData(data, schema)

		expect(results.length).to.equal(1)

		expect(results[0].object).to.be.undefined
		expect(results[0].errors).to.exist

		expect(results[0].errors).to.deep.equal([{
			error: 'required',
			// row: 2,
			column: 'NOT EXISTS',
			value: undefined,
			// value: null,
			type: Number
		}])
	})

	it('should support `required` function (returns `false`)', async () => {
		const schema = {
			courseTitle: {
				column: 'COURSE TITLE',
				type: String
			},
			notExists: {
				column: 'NOT EXISTS',
				type: Number,
				required: (row) => row.courseTitle !== 'Chemistry'
			}
		}

		const data = await readSheet(path.resolve('./test/testCases/schema-with-required-function.xlsx'))

		const results = parseData(data, schema)

		expect(results.length).to.equal(1)

		expect(results[0].object).to.exist
		expect(results[0].errors).to.be.undefined

		expect(results[0].object).to.deep.equal({
			courseTitle: 'Chemistry',
			notExists: undefined
		})
	})
})