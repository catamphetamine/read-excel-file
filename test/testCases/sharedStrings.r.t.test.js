import { describe, it } from 'mocha'
import { expect } from 'chai'

import readSheet from '../../source/export/readSheetNode.js'

describe('sharedStrings', () => {
	it('should parse sharedStrings (in case of <r><t>) and not include "phonetic" <rPr/>', async () => {
		// Parsing `<sst><si><r><t>` in `sharedStrings.xml`.
		// https://github.com/doy/spreadsheet-parsexlsx/issues/72
		const data = await readSheet('./test/testCases/sharedStrings.r.t.xlsx')

		expect(data).to.deep.equal([
			['Str']
		])
	})
})