export default async function({ readSheetFromFile, expect }) {
	try {
		await readSheetFromFile()
	} catch (error) {
		if (error.message !== '"xl/workbook.xml" file not found inside the `.xlsx` file') {
			throw error
		}
	}
}