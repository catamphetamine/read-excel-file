import { dropEmptyRows } from './readXlsx'

describe('readXlsx', () => {
	it('should generate row map', () => {
		const rowMap = []

		dropEmptyRows([
			[null, null, null],
			['A', 'B', 'C'],
			[null, 'D', null],
			[null, null, null],
			['E', 'F', 'G']
		],
		rowMap)
		.should.deep.equal([
			['A', 'B', 'C'],
			[null, 'D', null],
			['E', 'F', 'G']
		])

		rowMap.should.deep.equal([1, 2, 4])
	})
})