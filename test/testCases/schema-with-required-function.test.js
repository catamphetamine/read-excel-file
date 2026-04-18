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
				required: (parsedObject) => parsedObject.courseTitle === 'Chemistry'
			}
		}

		const data = await readSheet(path.resolve('./test/testCases/schema-with-required-function.xlsx'))

		const { objects, errors } = parseData(data, schema)

		expect(objects).to.be.undefined
		expect(errors).to.not.be.undefined

		expect(errors.length).to.equal(1)

		expect(errors).to.deep.equal([{
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

		const { objects, errors } = parseData(data, schema)

		expect(errors).to.be.undefined
		expect(objects).to.not.be.undefined

		expect(objects).to.deep.equal([{
			courseTitle: 'Chemistry',
			notExists: undefined
		}])
	})
})