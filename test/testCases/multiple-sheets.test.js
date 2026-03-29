import { describe, it } from 'mocha'
import { expect } from 'chai'

import readSheet from '../../source/export/readSheetNode.js'
import readXlsxFileNode from '../../source/export/readXlsxFileNode.js'

describe('sheet', () => {
	it('should read sheet by name (first)', async () => {
		const data = await readSheet('./test/testCases/multiple-sheets.xlsx', 'sheet 1')
		expect(data.length).to.equal(1)
		expect(data[0][0]).to.equal('First sheet')
	})

	it('should read sheet by name (second)', async () => {
		const data = await readSheet('./test/testCases/multiple-sheets.xlsx', 'sheet 2')
		expect(data.length).to.equal(1)
		expect(data[0][0]).to.equal('Second sheet')
	})

	it('should read sheet by index (first) (default)', async () => {
		const data = await readSheet('./test/testCases/multiple-sheets.xlsx')
		expect(data.length).to.equal(1)
		expect(data[0][0]).to.equal('First sheet')
	})

	it('should read sheet by index (first)', async () => {
		const data = await readSheet('./test/testCases/multiple-sheets.xlsx', 1)
		expect(data.length).to.equal(1)
		expect(data[0][0]).to.equal('First sheet')
	})

	it('should read sheet by name (second)', async () => {
		const data = await readSheet('./test/testCases/multiple-sheets.xlsx', 2)
		expect(data.length).to.equal(1)
		expect(data[0][0]).to.equal('Second sheet')
	})

	it('should read all sheets', async () => {
		const data = await readXlsxFileNode('./test/testCases/multiple-sheets.xlsx')
		expect(data).to.deep.equal([
			{
				sheet: 'sheet 1',
				data: [['First sheet']]
			},
			{
				sheet: 'sheet 2',
				data: [['Second sheet']]
			}
		])
	})
})