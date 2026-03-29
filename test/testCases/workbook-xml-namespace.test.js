import { describe, it } from 'mocha'
import { expect } from 'chai'

import readSheet from '../../source/export/readSheetNode.js'

// https://gitlab.com/catamphetamine/read-excel-file/-/issues/25
describe('workbook.xml:namespace', () => {
	it('should parse *.xlsx files where workbook.xml content tags have a namespace', async () => {
		const data = await readSheet('./test/testCases/workbook-xml-namespace.xlsx')

		expect(data[0][0]).to.equal('Phrase')
	})
})