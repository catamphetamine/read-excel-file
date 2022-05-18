import readXlsx from '../source/read/readXlsxFileNode.js'

describe('sheet', () => {
	it('should read sheet by name (first)', async () => {
		const data = await readXlsx('./test/spreadsheets/multiple-sheets.xlsx', { sheet: 'sheet 1' })
		expect(data.length).to.equal(1)
		data[0][0].should.equal('First sheet')
	})

	it('should read sheet by name (second)', async () => {
		const data = await readXlsx('./test/spreadsheets/multiple-sheets.xlsx', { sheet: 'sheet 2' })
		expect(data.length).to.equal(1)
		data[0][0].should.equal('Second sheet')
	})

	it('should read sheet by index (first) (default)', async () => {
		const data = await readXlsx('./test/spreadsheets/multiple-sheets.xlsx')
		expect(data.length).to.equal(1)
		data[0][0].should.equal('First sheet')
	})

	it('should read sheet by index (first)', async () => {
		const data = await readXlsx('./test/spreadsheets/multiple-sheets.xlsx', { sheet: 1 })
		expect(data.length).to.equal(1)
		data[0][0].should.equal('First sheet')
	})

	it('should read sheet by name (second)', async () => {
		const data = await readXlsx('./test/spreadsheets/multiple-sheets.xlsx', { sheet: 2 })
		expect(data.length).to.equal(1)
		data[0][0].should.equal('Second sheet')
	})

	it('should list sheets', async () => {
		const sheets = await readXlsx('./test/spreadsheets/multiple-sheets.xlsx', { getSheets: true })
		expect(sheets).to.deep.equal([
			{
				name: 'sheet 1'
			},
			{
				name: 'sheet 2'
			}
		])
	})
})