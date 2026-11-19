// This code was originally submitted by Jakub Stasiak:
// https://github.com/catamphetamine/read-excel-file/pull/130

import { describe, it } from 'mocha'
import { expect } from 'chai'

import convertArrayBufferOrArrayBufferViewToUint8Array from './convertArrayBufferOrArrayBufferViewToUint8Array.js'

describe('convertArrayBufferOrArrayBufferViewToUint8Array', () => {
	it('should preserve the memory and byte range of buffers and views', () => {
		const buffer = new ArrayBuffer(16) // Size: 16 bytes.

		const testCases = {
			'ArrayBuffer': buffer, // Offset: 0 bytes. Length: full length.
			'Uint8Array': new Uint8Array(buffer, 4, 8), // Offset: 4 bytes. Length: 8 bytes.
			'DataView': new DataView(buffer, 4, 8), // Offset: 4 bytes. Length: 8 bytes.
			'Uint16Array': new Uint16Array(buffer, 4, 4), // Offset: 4 bytes. Length: 4 two-bytes = 8 bytes.
			'BigUint64Array': new BigUint64Array(buffer, 0, 1) // Offset: 0 bytes. Length: 1 eight-byte = 8 bytes.
		}

		for (const name of Object.keys(testCases)) {
			const input = testCases[name]
			const output = convertArrayBufferOrArrayBufferViewToUint8Array(input)
			// Validate that the output uses the same buffer as the input.
			expect(output.buffer, name).to.equal(input === buffer ? buffer : input.buffer)
			// Validate that the output uses the same range of bytes in the buffer as the input.
			expect(output.byteOffset, name).to.equal(input === buffer ? 0 : input.byteOffset)
			expect(output.byteLength, name).to.equal(input.byteLength)
		}
	})
})