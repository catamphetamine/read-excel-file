import { describe, it } from 'mocha'
import { expect } from 'chai'

import { zipSync, strToU8 } from 'fflate'

import unzipFromArrayBuffer from './unzipFromArrayBuffer.js'
import UnzipError from './UnzipError.js'

describe('unzipFromArrayBuffer', () => {
	it('should read a `.zip` archive', async () => {
		const zip = zipSync({ 'a.xml': strToU8('<a/>') })
		const files = await unzipFromArrayBuffer(zip)
		expect(Object.keys(files)).to.deep.equal(['a.xml'])
	})

	it('should read a file that is compressed really well', async () => {
		const zip = zipSync({ 'a.xml': new Uint8Array(1024 * 1024) }, { level: 9 })
		expect(zip.length).to.be.below(2 * 1024)
		const files = await unzipFromArrayBuffer(zip)
		expect(files['a.xml'].length).to.equal(1024 * 1024)
	})

	it('should read "stored" (uncompressed) and empty files', async () => {
		const zip = zipSync({
			'a.xml': [strToU8('<a/>'), { level: 0 }],
			'b.xml': new Uint8Array(0),
			'c.xml': [new Uint8Array(0), { level: 0 }]
		})
		const files = await unzipFromArrayBuffer(zip)
		expect(Object.keys(files)).to.deep.equal(['a.xml', 'b.xml', 'c.xml'])
	})

	// https://github.com/101arrowz/fflate/issues/311
	it('should reject a file that declares an impossible uncompressed size', async () => {
		const zip = zipSync({ 'a.xml': strToU8('<a/>') })
		setDeclaredFileSize(zip, { uncompressedSize: GIGABYTE })
		await expectUnzipError(unzipFromArrayBuffer(zip))
	})

	it('should reject a file that declares a compressed size that doesn\'t fit in the archive', async () => {
		const zip = zipSync({ 'a.xml': strToU8('<a/>') })
		// The ratio of the declared sizes is possible for `DEFLATE`.
		setDeclaredFileSize(zip, { compressedSize: GIGABYTE / 1024, uncompressedSize: GIGABYTE })
		await expectUnzipError(unzipFromArrayBuffer(zip))
	})

	it('should reject files whose declared compressed sizes don\'t fit in the archive when combined', async () => {
		const zip = zipSync({
			'a.xml': strToU8('<a/>'),
			'b.xml': strToU8('<b/>')
		})
		// Each of the two files claims more than a half of the archive.
		const compressedSize = Math.ceil(zip.length / 2) + 1
		setDeclaredFileSize(zip, { compressedSize, uncompressedSize: compressedSize * 1000 }, 0)
		setDeclaredFileSize(zip, { compressedSize, uncompressedSize: compressedSize * 1000 }, 1)
		await expectUnzipError(unzipFromArrayBuffer(zip))
	})

	it('should not validate the declared size of a file that is ignored', async () => {
		const zip = zipSync({
			'a.xml': strToU8('<a/>'),
			'b.bin': strToU8('binary')
		})
		setDeclaredFileSize(zip, { uncompressedSize: GIGABYTE }, 1)
		const files = await unzipFromArrayBuffer(zip, {
			filter: ({ path }) => path.endsWith('.xml')
		})
		expect(Object.keys(files)).to.deep.equal(['a.xml'])
	})
})

const GIGABYTE = 1024 * 1024 * 1024

// Overwrites the sizes that're declared for a file in the "central directory" of a `.zip` archive.
// The "central directory" is where `fflate`'s `unzip()` function reads the file sizes from.
function setDeclaredFileSize(zip, { compressedSize, uncompressedSize }, fileIndex = 0) {
	// Find the "central directory" entry of the file. Its signature is "PK\x01\x02".
	let offset = -1
	for (let i = 0; i <= fileIndex; i++) {
		offset = zip.findIndex((_, j) => {
			return j > offset && zip[j] === 0x50 && zip[j + 1] === 0x4B && zip[j + 2] === 1 && zip[j + 3] === 2
		})
	}
	const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength)
	if (compressedSize !== undefined) {
		view.setUint32(offset + 20, compressedSize, true)
	}
	if (uncompressedSize !== undefined) {
		view.setUint32(offset + 24, uncompressedSize, true)
	}
}

async function expectUnzipError(promise) {
	let result
	let thrown
	try {
		result = await promise
	} catch (caught) {
		thrown = caught
	}
	expect(result).to.be.undefined
	expect(thrown).to.be.an.instanceof(UnzipError)
}