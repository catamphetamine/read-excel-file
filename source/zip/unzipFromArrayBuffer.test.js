import { describe, it } from 'mocha'
import { expect } from 'chai'

import { zipSync, strToU8 } from 'fflate'

import unzipFromArrayBuffer, { unzipFromArrayBufferUsingFunction } from './unzipFromArrayBuffer.js'

describe('unzipFromArrayBuffer', () => {
	it('should read a `.zip` archive', async () => {
		const zip = zipSync({ 'a.xml': strToU8('<a/>') })
		const files = await unzipFromArrayBuffer(zip)
		expect(Object.keys(files)).to.deep.equal(['a.xml'])
	})

	it('should pass the bounded input memory to the decompressor without copying', async () => {
		const zip = zipSync({ 'a.xml': strToU8('<a/>') })
		const allocation = Buffer.alloc(zip.byteLength + 64, 0x58)
		allocation.set(zip, 32)
		const input = allocation.subarray(32, 32 + zip.byteLength)
		await unzipFromArrayBufferUsingFunction(input, {}, (bytes) => {
			expect(bytes.buffer).to.equal(input.buffer)
			expect(bytes.byteOffset).to.equal(input.byteOffset)
			expect(bytes.byteLength).to.equal(input.byteLength)
			return Promise.resolve({})
		}, true)
		const files = await unzipFromArrayBuffer(input)
		expect(files['a.xml']).to.deep.equal(strToU8('<a/>'))
	})

	it('should read bounded views using a worker without modifying the input', async () => {
		// Highly compressed entries larger than 512 KB use fflate's worker path.
		const contents = strToU8('<a>' + 'x'.repeat(600000) + '</a>')
		const zip = zipSync({ 'a.xml': contents })
		for (const BufferType of [ArrayBuffer, SharedArrayBuffer]) {
			const allocation = new BufferType(zip.byteLength + 64)
			const bytes = new Uint8Array(allocation)
			bytes.fill(0x58)
			bytes.set(zip, 32)
			const input = new Uint8Array(allocation, 32, zip.byteLength)
			const files = await unzipFromArrayBuffer(input)
			expect(files['a.xml'], BufferType.name).to.deep.equal(contents)
			expect(input.byteLength, BufferType.name).to.equal(zip.byteLength)
			expect(input, BufferType.name).to.deep.equal(zip)
			expect(bytes[0], BufferType.name).to.equal(0x58)
			expect(bytes[32 + zip.byteLength], BufferType.name).to.equal(0x58)
		}
	})
})