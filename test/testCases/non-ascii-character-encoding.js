export default async function({ readSheetFromFile, expect }) {
	const data = await readSheetFromFile()

	const row = data.find((row) => {
		return row[1] === 'Песчано-гравийные породы, строительный камень' &&
			row[2] === '"К9, Даргинский", Амурский район';
	});

	expect(row[14]).to.equal('ООО "Транснефть-Дальний Восток, лицензия АМУ00432ТЭ')
}