import { describe, it } from 'mocha'
import { expect } from 'chai'

import dropEmptyColumns from './dropEmptyColumns.js'

describe('dropEmptyColumns', () => {
	it('should drop empty columns (only at the end)', () => {
		expect(
			dropEmptyColumns([
				[null, 'A', 'B', 'C', null, null],
				[null, 'D', null, null, null, null],
				[null, null, null, null, null, null],
				[null, null, 'E', 'F', 'G', null]
			], {
				onlyTrimAtTheEnd: true
			})
		).to.deep.equal([
			[null, 'A', 'B', 'C', null],
			[null, 'D', null, null, null],
			[null, null, null, null, null],
			[null, null, 'E', 'F', 'G']
		])
	})

	it('should drop empty columns', () => {
		expect(
			dropEmptyColumns([
				[null, 'A', 'B', 'C', null, null],
				[null, 'D', null, null, null, null],
				[null, null, null, null, null, null],
				[null, null, 'E', 'F', 'G', null]
			])
		).to.deep.equal([
			['A', 'B', 'C', null],
			['D', null, null, null],
			[null, null, null, null],
			[null, 'E', 'F', 'G']
		])
	})
})