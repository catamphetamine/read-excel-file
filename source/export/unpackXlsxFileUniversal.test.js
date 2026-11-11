// This code was originally submitted by Etienne Prothon.
// https://gitlab.com/catamphetamine/read-excel-file/-/merge_requests/11

import { describe, it } from 'mocha'
import { expect } from 'chai'

import { zipSync, strToU8 } from 'fflate'

import InvalidInputError from '../xlsx/file/InvalidInputError.js'

import unpackXlsxFileUniversal from './unpackXlsxFileUniversal.js'

describe('unpackXlsxFileUniversal', () => {
	it('should reject on invalid (non-zip) data', async () => {
		const garbage = Buffer.from('this is definitely not a zip archive')

		let thrown
		try {
			await unpackXlsxFileUniversal(getArrayBuffer(garbage))
		} catch (caught) {
			thrown = caught
		}
		expect(thrown).to.be.an.instanceof(InvalidInputError)
		expect(thrown.code).to.equal('FILE_NOT_SUPPORTED')
	})

	it('should not reject on valid (zip) data', async () => {
		const fileData = Buffer.from([0x50, 0x4B, 0x05, 0x06, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])

		let thrown
		try {
			await unpackXlsxFileUniversal(getArrayBuffer(fileData))
		} catch (caught) {
			thrown = caught
		}
		expect(thrown).to.be.undefined
	})


	it('should reject invalid ZIP input', async () => {
		const invalidZip = Buffer.from([0x50, 0x4B, 0x99, 0x99])

		let thrown
		try {
			await unpackXlsxFileUniversal(getArrayBuffer(invalidZip))
		} catch (caught) {
			thrown = caught
		}
		expect(thrown).to.be.an.instanceof(InvalidInputError)
		expect(thrown.code).to.equal('INVALID_ZIP')
	})

	it('should reject empty input', async () => {
		const empty = Buffer.from([])

		let thrown
		try {
			await unpackXlsxFileUniversal(getArrayBuffer(empty))
		} catch (caught) {
			thrown = caught
		}
		expect(thrown).to.be.an.instanceof(InvalidInputError)
		expect(thrown.code).to.equal('NO_DATA')
	})

	it('should reject a legacy binary `.xls` file', async () => {
		// The first bytes of an OLE2 Compound File — the container of a binary `.xls` file.
		const xls = Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1])

		let thrown
		try {
			await unpackXlsxFileUniversal(getArrayBuffer(xls))
		} catch (caught) {
			thrown = caught
		}
		expect(thrown).to.be.an.instanceof(InvalidInputError)
		expect(thrown.code).to.equal('XLS_FILE_NOT_SUPPORTED')
	})

	// https://github.com/101arrowz/fflate/issues/311
	it('should reject a file that declares an impossible uncompressed size', async () => {
		const zip = zipSync({ 'xl/workbook.xml': strToU8('<workbook/>') })
		// Overwrite the uncompressed size that is declared in the "central directory"
		// of the archive (signature "PK\x01\x02") with 1 gigabyte.
		const offset = zip.findIndex((_, i) => zip[i] === 0x50 && zip[i + 1] === 0x4B && zip[i + 2] === 1 && zip[i + 3] === 2)
		new DataView(zip.buffer).setUint32(offset + 24, 1024 * 1024 * 1024, true)

		let thrown
		try {
			await unpackXlsxFileUniversal(getArrayBuffer(Buffer.from(zip)))
		} catch (caught) {
			thrown = caught
		}
		expect(thrown).to.be.an.instanceof(InvalidInputError)
		expect(thrown.code).to.equal('INVALID_ZIP')
	})
})

// Returns an exact `ArrayBuffer` from a possibly-"pooled" `Buffer`.
function getArrayBuffer(buffer) {
	return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
}