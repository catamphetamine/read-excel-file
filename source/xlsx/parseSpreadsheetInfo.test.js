import { describe, it } from 'mocha'
import { expect } from 'chai'

import parseXml from '../xml/parseXml.js'
import parseSpreadsheetInfo from './parseSpreadsheetInfo.js'

describe('parseSpreadsheetInfo', () => {
	// `date1904` attribute of `<workbookPr/>` is an `xsd:boolean`: `1`/`true` or `0`/`false`.
	for (const [date1904, epoch1904] of [['1', true], ['true', true], ['0', false], ['false', false]]) {
		it(`should read date1904="${date1904}" as ${epoch1904}`, async () => {
			const info = await parseSpreadsheetInfo(workbookXml(`<workbookPr date1904="${date1904}"/>`), parseXml)
			expect(info.epoch1904).to.equal(epoch1904)
		})
	}

	it('should default to 1900-based dates when `date1904` or `<workbookPr/>` is absent', async () => {
		expect((await parseSpreadsheetInfo(workbookXml('<workbookPr/>'), parseXml)).epoch1904).to.equal(false)
		expect((await parseSpreadsheetInfo(workbookXml(''), parseXml)).epoch1904).to.equal(false)
	})

	it('should still read the sheets', async () => {
		const info = await parseSpreadsheetInfo(workbookXml('<workbookPr date1904="true"/>'), parseXml)
		expect(info.sheets).to.deep.equal([{ id: 1, name: 'Sheet1', relationId: 'rId1' }])
	})
})

function workbookXml(workbookPr) {
	return '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
		workbookPr +
		'<sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>'
}
