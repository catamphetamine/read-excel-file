import { describe, it } from 'mocha'
import { expect } from 'chai'

import path from 'path'

import readXlsxFile from '../../source/export/readXlsxFileNode.js'

describe('read-excel-file', () => {
	it('should support `required` function (returns `true`)', () => {
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

		return readXlsxFile(path.resolve('./test/testCases/schema-with-required-function.xlsx'), {
			schema
		}).then(({ rows, errors }) => {
			expect(rows).to.deep.equal([{
				courseTitle: 'Chemistry'
			}])
			expect(errors).to.deep.equal([{
				error: 'required',
				row: 2,
				column: 'NOT EXISTS',
				value: undefined,
				// value: null,
				type: Number
			}])
		})
	})

	it('should support `required` function (returns `false`)', () => {
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

		return readXlsxFile(path.resolve('./test/testCases/schema-with-required-function.xlsx'), {
			schema
		}).then(({ rows, errors }) => {
			expect(rows).to.deep.equal([{
				courseTitle: 'Chemistry'
			}])
			expect(errors).to.deep.equal([])
		})
	})
})