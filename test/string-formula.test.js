import readXlsx from '../source/readXlsxFileNode'

describe('string formula', () => {
	it('should return <v/> of string cells having a formula', async () => {
		const data = await readXlsx(__dirname + '/spreadsheets/string-formula.xlsx')
		expect(data.length).to.equal(6)
		data[4][2].should.equal('Value2')
		data[4][3].should.equal('Value3')
		data[5][1].should.equal('Value2Value3')
		// Just a check for numeric formula <v/>alue.
		data[5][2].should.equal(0.909297426825682)
	})
})