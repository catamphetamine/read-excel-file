import readXlsx from '../source/read/readXlsxFileNode.js'

describe('string formula', () => {
	it('should return <v/> of string cells having a formula', async () => {
		const data = await readXlsx('./test/spreadsheets/string-formula.xlsx')
		expect(data.length).to.equal(7)
		data[4][2].should.equal('Value2')
		data[4][3].should.equal('Value3')
		// The empty row with index `5` is preserved.
		data[6][1].should.equal('Value2Value3')
		// Just a check for numeric formula <v/>alue.
		data[6][2].should.equal(0.909297426825682)
	})
})