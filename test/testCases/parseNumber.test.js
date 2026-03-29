import { describe, it } from 'mocha'
import { expect } from 'chai'

import path from 'path'

import readSheet from '../../source/export/readSheetNode.js'

describe('read-excel-file', () => {
	it('should support custom `parseNumber` function', async () => {
		const data = await readSheet(path.resolve('./test/testCases/parseNumber.xlsx'), {
			parseNumber: (string) => string
		})

		expect(data).to.deep.equal([
			[
				'START DATE',
				'NUMBER OF STUDENTS',
				'IS FREE',
				'COST',
				'COURSE TITLE',
				'CONTACT'
			],
			[
				new Date(Date.UTC(2018, 3 - 1, 24)),
				'123',
				false,
				'210.45',
				'Chemistry',
				'(123) 456-7890'
			]
		])
	})
})
