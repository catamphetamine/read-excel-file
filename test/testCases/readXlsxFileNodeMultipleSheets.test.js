import { describe, it } from 'mocha'
import { expect } from 'chai'

import path from 'path'

import readXlsxFileNode from '../../source/export/readXlsxFileNode.js'

describe('readXlsxFileNode', () => {
	it('should read all sheets in an *.xlsx file in Node.js', () => {
		return readXlsxFileNode(path.resolve('./test/testCases/multiple-sheets.xlsx')).then((data) => {
			expect(data).to.deep.equal([{
				sheet: 'sheet 1',
				data: [['First sheet']]
			}, {
				sheet: 'sheet 2',
				data: [['Second sheet']]
			}])
		})
	})
})