import { describe, it } from 'mocha'
import { expect } from 'chai'

import path from 'path'

import readSheetNode from '../../source/export/readSheetNode.js'
import parseData from '../../source/parseData/parseData.js'

describe('readSheetNode', () => {
	it('should read *.xlsx file in Node.js and parse it to JSON', async () => {
		const schema = {
			date: {
				column: 'START DATE',
				type: Date
			},
			numberOfStudents: {
				column: 'NUMBER OF STUDENTS',
				type: Number,
				required: true
			},
			course: {
				schema: {
					isFree: {
						column: 'IS FREE',
						type: Boolean
						// Excel stores booleans as numbers:
						// `1` is `true` and `0` is `false`.
						// Such numbers are parsed into booleans.
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
				required: true,
				type(value) {
					return '+11234567890'
				}
			}
		}

		// const rowIndexSourceMap = []

		const data = await readSheetNode(path.resolve('./test/testCases/schema.xlsx'))

		const { objects, errors } = parseData(data, schema) // { rowIndexSourceMap }

		expect(errors).to.be.undefined
		expect(objects).to.not.be.undefined

		expect(objects).to.deep.equal([{
			date: new Date(Date.UTC(2018, 3 - 1, 24)),
			numberOfStudents: 123,
			course: {
				isFree: false,
				cost: 210.45,
				title: 'Chemistry'
			},
			contact: '+11234567890'
		}])

		// expect(rowIndexSourceMap).to.deep.equal([0, 1])
	})
})