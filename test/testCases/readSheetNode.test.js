import { describe, it } from 'mocha'
import { expect } from 'chai'

import readSheetNode from '../../source/export/readSheetNode.js'

describe('readSheetNode', () => {
	it('should read a single sheet', async () => {
		// Without an explicit sheet number or name.
		await readSheetNode('./test/testCases/readSheetNode.xlsx')

		// With an explicit sheet number.
		await readSheetNode(
			'./test/testCases/readSheetNode.xlsx',
			1
		)

		// With an explicit sheet name.
		await readSheetNode(
			'./test/testCases/readSheetNode.xlsx',
			'Sheet1'
		)
	})

	it('should read a single sheet when options are passed', async () => {
		// Without an explicit sheet number or name.
		await readSheetNode('./test/testCases/readSheetNode.xlsx', { trim: false })
	})

	it('should throw an error when sheet not found', async () => {
		// By id.
		try {
			await readSheetNode('./test/testCases/readSheetNode.xlsx', 2)
		} catch (error) {
			expect(error.message).to.equal('Sheet number out of bounds: 2. Available sheets count: 1')
		}
		// By name.
		try {
			await readSheetNode('./test/testCases/readSheetNode.xlsx', 'Sheet2')
		} catch (error) {
			expect(error.message).to.equal('Sheet "Sheet2" not found. Available sheets: "Sheet1"')
		}
	})
})