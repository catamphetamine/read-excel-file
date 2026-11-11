// This code was originally submitted by Etienne Prothon.
// https://gitlab.com/catamphetamine/read-excel-file/-/merge_requests/11

import { describe, it } from 'mocha'
import { expect } from 'chai'

import { zipSync, strToU8 } from 'fflate'

import { Readable } from 'node:stream'

import InvalidInputError from '../xlsx/file/InvalidInputError.js'

import unpackXlsxFileNode from './unpackXlsxFileNode.js'

describe('unpackXlsxFileNode', () => {
	it('should reject on invalid (non-zip) data', async () => {
		const garbage = Buffer.from('this is definitely not a zip archive')

		let thrown
		try {
			await unpackXlsxFileNode(createStreamFromBuffer(garbage))
		} catch (caught) {
			thrown = caught
		}
		expect(thrown).to.be.an.instanceof(InvalidInputError)
		expect(thrown.code).to.equal('FILE_NOT_SUPPORTED')
	})

	it('should reject on invalid (non-zip) data (when the input is split across one-byte chunks)', async () => {
		const garbage = Buffer.from('this is definitely not a zip archive')

		let thrown
		try {
			await unpackXlsxFileNode(createStreamFromBuffer(garbage, { chunkSize: 1 }))
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
			await unpackXlsxFileNode(createStreamFromBuffer(fileData))
		} catch (caught) {
			thrown = caught
		}
		expect(thrown).to.be.undefined
	})

	it('should not reject on valid (zip) data (when the input is split across one-byte chunks)', async () => {
		const fileData = Buffer.from([0x50, 0x4B, 0x05, 0x06, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])

		let thrown
		try {
			await unpackXlsxFileNode(createStreamFromBuffer(fileData, { chunkSize: 1 }))
		} catch (caught) {
			thrown = caught
		}
		expect(thrown).to.be.undefined
	})

	it('should reject invalid ZIP input', async () => {
		// Breakdown of the Structure
		// * Signature (50 4B 03 04): The correct first 4 bytes for a local ZIP file header ("PK\x03\x04").
		// * Version & Flags (14 00 00 00): Minimum version needed to extract and general purpose flags.
		// * Compression Method (08 00): Set to 8 (deflated).
		// * CRC-32 & Sizes (00 00 00 00 ...): Placeholders for data sizes and checksum.
		// * File Name Length (05 00): Name length set to 5 bytes.
		// * Extra Field Length (00 00): No extra fields.
		// * File Name (61 2E 74 78 75): Encodes the filename "a.txu".
		// * Corrupt Data Body (6E 6D 61 74): Invalid or truncated compressed stream payload that fails decompression and triggers an extraction error.
		const invalidZip = Buffer.from([0x50, 0x4B, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x05, 0x00, 0x00, 0x00, 0x61, 0x2E, 0x74, 0x78, 0x75, 0x6E, 0x6D, 0x61, 0x74])

		let thrown
		try {
			await unpackXlsxFileNode(createStreamFromBuffer(invalidZip))
		} catch (caught) {
			thrown = caught
		}

		// It looks like `fflate`'s `Unzip` doesn't ever complain about whatever data is thrown at it.
		// Due to how `.zip` file format is defined, "garbage" data could be placed at various
		// places in it and it'd still be a valid `.zip` archive. It's likely that for this reason
		// `fflate` doesn't ever complain and simply emits no entries when fed any kind of invalid data.
		//
		// So in case of using `unzipFromStream.fflate.js`, `thrown` will be `undefined`.
		// But it won't be `undefined` in case of using `unzipFromStream.unzipper.js`.
		//
		if (thrown) {
			expect(thrown).to.be.an.instanceof(InvalidInputError)
			expect(thrown.code).to.equal('INVALID_ZIP')
		}
	})

	it('should reject empty input', async () => {
		const empty = Buffer.from([])

		let thrown
		try {
			await unpackXlsxFileNode(createStreamFromBuffer(empty))
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
			await unpackXlsxFileNode(createStreamFromBuffer(xls))
		} catch (caught) {
			thrown = caught
		}
		expect(thrown).to.be.an.instanceof(InvalidInputError)
		expect(thrown.code).to.equal('XLS_FILE_NOT_SUPPORTED')
	})

	it('should reject a legacy binary `.xls` file (when the input is split across one-byte chunks)', async () => {
		const xls = Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1])

		let thrown
		try {
			await unpackXlsxFileNode(createStreamFromBuffer(xls, { chunkSize: 1 }))
		} catch (caught) {
			thrown = caught
		}
		expect(thrown).to.be.an.instanceof(InvalidInputError)
		expect(thrown.code).to.equal('XLS_FILE_NOT_SUPPORTED')
	})

	// https://github.com/101arrowz/fflate/issues/311
	it('should not allocate memory based on the declared uncompressed size of a file', async () => {
		const zip = zipSync({ 'xl/workbook.xml': strToU8('<workbook/>') })
		// Overwrite the uncompressed size that is declared in the "local file header"
		// at the start of the archive with 1 gigabyte.
		new DataView(zip.buffer).setUint32(22, 1024 * 1024 * 1024, true)

		const files = await unpackXlsxFileNode(createStreamFromBuffer(Buffer.from(zip)))
		expect(files['xl/workbook.xml'].buffer.byteLength).to.equal('<workbook/>'.length)
	})
})

// Creates a Node.js Stream from a given `buffer` containing the data.
// The stream will split the data into `chunkSize`-byte chunks.
// (this is used to exercise reading across arbitrary chunk boundaries)
function createStreamFromBuffer(buffer, { chunkSize = buffer.length } = {}) {
	const chunks = []
	for (let i = 0; i < buffer.length; i += chunkSize) {
		chunks.push(buffer.subarray(i, i + chunkSize))
	}
	return Readable.from(chunks.length > 0 ? chunks : [Buffer.alloc(0)])
}
