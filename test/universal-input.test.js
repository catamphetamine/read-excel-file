import { describe, it } from 'mocha'
import { expect } from 'chai'

import fs from 'node:fs'
import { runInNewContext } from 'node:vm'

import readSheet from '../source/export/readSheetUniversal.js'
import readXlsxFile from '../source/export/readXlsxFileUniversal.js'
import InvalidInputError from '../source/xlsx/file/InvalidInputError.js'

describe('universal input', () => {
	const file = fs.readFileSync('test/testCases/read-sheet.xlsx')
	const allocation = new ArrayBuffer(file.byteLength + 64)
	const bytes = new Uint8Array(allocation)
	bytes.fill(0x58)
	bytes.set(file, 32)
	const sharedAllocation = new SharedArrayBuffer(bytes.byteLength)
	new Uint8Array(sharedAllocation).set(bytes)
	const inputs = [
		['Blob', new Blob([file])],
		['Uint8Array', new Uint8Array(file)],
		['Buffer', file],
		['Uint8Array subarray', bytes.subarray(32, 32 + file.byteLength)],
		['Buffer subarray', Buffer.from(allocation).subarray(32, 32 + file.byteLength)],
		['DataView', new DataView(allocation, 32, file.byteLength)],
		['Uint16Array', new Uint16Array(allocation, 32, file.byteLength / 2)],
		['shared Uint8Array', new Uint8Array(sharedAllocation, 32, file.byteLength)],
		['cross-realm Uint8Array', runInNewContext(
			'new Uint8Array(buffer, 32, length)',
			{ buffer: allocation, length: file.byteLength }
		)]
	]

	it('should read workbooks from buffers and views', async () => {
		const expected = await readXlsxFile(new Uint8Array(file).buffer)
		for (const [name, input] of inputs) {
			expect(await readSheet(input, 'Sheet1'), name).to.deep.equal(expected[0].data)
			expect(await readXlsxFile(input), name).to.deep.equal(expected)
		}
	})

	it('should reject empty and invalid views', async () => {
		for (const [name, input, code] of [
			['empty view', new Uint8Array(allocation, 32, 0), 'NO_DATA'],
			['invalid view', bytes.subarray(0, 32), 'FILE_NOT_SUPPORTED']
		]) {
			let thrown
			try {
				await readSheet(input)
			} catch (caught) {
				thrown = caught
			}
			expect(thrown, name).to.be.an.instanceof(InvalidInputError)
			expect(thrown.code, name).to.equal(code)
		}
	})
})
