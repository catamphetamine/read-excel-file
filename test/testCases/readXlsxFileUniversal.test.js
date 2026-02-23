import fs from 'fs/promises'

import readXlsxFileUniversal from '../../source/export/readXlsxFileUniversal.js'

describe('readXlsxFileUniversal', () => {
	it('should read *.xlsx files', async () => {
		const data = await readXlsxFileUniversal(
			await readFileAsBlob('./test/testCases/readXlsxFileUniversal.xlsx')
		)

		expect(data).to.deep.equal([
			['Test 123']
		])
	})
})

async function readFileAsBlob(filePath) {
	// Read the file into a Buffe.
	const buffer = await fs.readFile(filePath)
	// Create a new Blob using the buffer data.
	// The Blob constructor accepts an array of data chunks.
	return new Blob([buffer])
}