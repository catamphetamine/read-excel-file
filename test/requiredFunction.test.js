import path from 'path'

import readXlsx from '../source/read/readXlsxFileNode.js'

describe('read-excel-file', () => {
	it('should support `required` function (returns `true`)', () => {
		const schema = {
			'COURSE TITLE': {
				prop: 'courseTitle',
				type: String
			},
			'NOT EXISTS': {
				prop: 'notExists',
				type: Number,
				required: (row) => row.courseTitle === 'Chemistry'
			}
		}

		return readXlsx(path.resolve('./test/spreadsheets/course.xlsx'), {
			schema
		}).then(({ rows, errors }) => {
			rows.should.deep.equal([{
				courseTitle: 'Chemistry'
			}])
			errors.should.deep.equal([{
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
			'COURSE TITLE': {
				prop: 'courseTitle',
				type: String
			},
			'NOT EXISTS': {
				prop: 'notExists',
				type: Number,
				required: (row) => row.courseTitle !== 'Chemistry'
			}
		}

		return readXlsx(path.resolve('./test/spreadsheets/course.xlsx'), {
			schema
		}).then(({ rows, errors }) => {
			rows.should.deep.equal([{
				courseTitle: 'Chemistry'
			}])
			errors.should.deep.equal([])
		})
	})
})