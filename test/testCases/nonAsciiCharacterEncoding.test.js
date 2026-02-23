import readXlsxFile from '../../source/export/readXlsxFileNode.js'

describe('nonAsciiCharacterEncoding', () => {
	it('should correctly read non-ASCII characters', async () => {
		const data = await readXlsxFile('./test/testCases/nonAsciiCharacterEncoding.xlsx')

		const row = data.find((row) => {
			return row[1] === 'Песчано-гравийные породы, строительный камень' &&
				row[2] === '"К9, Даргинский", Амурский район';
		});

		expect(row[14]).to.equal('ООО "Транснефть-Дальний Восток, лицензия АМУ00432ТЭ')
	})
})