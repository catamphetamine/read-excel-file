import { describe, it } from 'mocha'
import { expect } from 'chai'

import dropEmptyRows from './dropEmptyRows.js'

describe('dropEmptyRows', () => {
	it('should drop empty rows (only at the end)', () => {
		expect(
			dropEmptyRows([
				[null, null, null],
				['A', 'B', 'C'],
				[null, 'D', null],
				[null, null, null],
				['E', 'F', 'G'],
				[null, null, null]
			], {
				onlyTrimAtTheEnd: true
			})
		).to.deep.equal([
			[null, null, null],
			['A', 'B', 'C'],
			[null, 'D', null],
			[null, null, null],
			['E', 'F', 'G']
		])
	})

	it('should drop empty rows', () => {
		expect(
			dropEmptyRows([
				[null, null, null],
				['A', 'B', 'C'],
				[null, 'D', null],
				[null, null, null],
				['E', 'F', 'G'],
				[null, null, null]
			])
		).to.deep.equal([
			['A', 'B', 'C'],
			[null, 'D', null],
			['E', 'F', 'G']
		])
	})

	it('should generate row map when dropping empty rows', () => {
		const rowIndexSourceMap = [0, 1, 2, 3, 4]

		expect(
			dropEmptyRows([
				[null, null, null],
				['A', 'B', 'C'],
				[null, 'D', null],
				[null, null, null],
				['E', 'F', 'G']
			],
			{ rowIndexSourceMap }
		)).to.deep.equal([
			['A', 'B', 'C'],
			[null, 'D', null],
			['E', 'F', 'G']
		])

		expect(rowIndexSourceMap).to.deep.equal([1, 2, 4])
	})
})