import readXlsx from '../source/readXlsxFileNode'

describe('sheet', () => {
	it('should read sheet by name (first)', async () => {
		const data = await readXlsx(__dirname + '/spreadsheets/multiple-sheets.xlsx', { sheet: 'sheet 1' })
		expect(data.length).to.equal(1)
		data[0][0].should.equal('First sheet')
	})

	it('should read sheet by name (second)', async () => {
		const data = await readXlsx(__dirname + '/spreadsheets/multiple-sheets.xlsx', { sheet: 'sheet 2' })
		expect(data.length).to.equal(1)
		data[0][0].should.equal('Second sheet')
	})

	it('should list sheets', async () => {
		const sheets = await readXlsx(__dirname + '/spreadsheets/multiple-sheets.xlsx', { getSheets: true })
		expect(sheets).to.deep.equal({
			1: 'sheet 1',
			2: 'sheet 2'
		})
	})
})