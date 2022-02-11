import path from 'path'

import readSheetNamesNode from './readSheetNamesNode'

describe('readSheetNamesNode', () => {
	it('should read the list of sheet names in an *.xlsx file in Node.js', () => {
		return readSheetNamesNode(path.resolve(__dirname, '../../test/spreadsheets/multiple-sheets.xlsx')).then((sheetNames) => {
			sheetNames.should.deep.equal(['sheet 1', 'sheet 2'])
		})
	})
})