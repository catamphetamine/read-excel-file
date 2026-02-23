import path from 'path'

import readSheetNamesNode from '../../source/export/readSheetNamesNode.js'

describe('readSheetNamesNode', () => {
	it('should read the list of sheet names in an *.xlsx file in Node.js', () => {
		return readSheetNamesNode(path.resolve('./test/testCases/multiple-sheets.xlsx')).then((sheetNames) => {
			sheetNames.should.deep.equal(['sheet 1', 'sheet 2'])
		})
	})
})