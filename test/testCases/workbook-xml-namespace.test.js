import readXlsxFile from '../../source/export/readXlsxFileNode.js'

// https://gitlab.com/catamphetamine/read-excel-file/-/issues/25
describe('workbook.xml:namespace', () => {
	it('should parse *.xlsx files where workbook.xml content tags have a namespace', async () => {
		const data = await readXlsxFile('./test/testCases/workbook-xml-namespace.xlsx')

		expect(data[0][0]).to.equal('Phrase')
	})
})