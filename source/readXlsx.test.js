import { dropEmptyRows, dropEmptyColumns } from './readXlsx'

describe('readXlsx', () => {
	it('should drop empty rows (only at the end)', () => {
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
		.should.deep.equal([
			[null, null, null],
			['A', 'B', 'C'],
			[null, 'D', null],
			[null, null, null],
			['E', 'F', 'G']
		])
	})

	it('should drop empty rows', () => {
		dropEmptyRows([
			[null, null, null],
			['A', 'B', 'C'],
			[null, 'D', null],
			[null, null, null],
			['E', 'F', 'G'],
			[null, null, null]
		])
		.should.deep.equal([
			['A', 'B', 'C'],
			[null, 'D', null],
			['E', 'F', 'G']
		])
	})

	it('should drop empty columns (only at the end)', () => {
		dropEmptyColumns([
			[null, 'A', 'B', 'C', null, null],
			[null, 'D', null, null, null, null],
			[null, null, null, null, null, null],
			[null, null, 'E', 'F', 'G', null]
		], {
			onlyTrimAtTheEnd: true
		})
		.should.deep.equal([
			[null, 'A', 'B', 'C', null],
			[null, 'D', null, null, null],
			[null, null, null, null, null],
			[null, null, 'E', 'F', 'G']
		])
	})

	it('should drop empty columns', () => {
		dropEmptyColumns([
			[null, 'A', 'B', 'C', null, null],
			[null, 'D', null, null, null, null],
			[null, null, null, null, null, null],
			[null, null, 'E', 'F', 'G', null]
		])
		.should.deep.equal([
			['A', 'B', 'C', null],
			['D', null, null, null],
			[null, null, null, null],
			[null, 'E', 'F', 'G']
		])
	})

	it('should generate row map when dropping empty rows', () => {
		const rowMap = [0, 1, 2, 3, 4]

		dropEmptyRows([
			[null, null, null],
			['A', 'B', 'C'],
			[null, 'D', null],
			[null, null, null],
			['E', 'F', 'G']
		],
		{ rowMap })
		.should.deep.equal([
			['A', 'B', 'C'],
			[null, 'D', null],
			['E', 'F', 'G']
		])

		rowMap.should.deep.equal([1, 2, 4])
	})
})