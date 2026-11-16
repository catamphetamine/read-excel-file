import { describe, it } from 'mocha'
import { expect } from 'chai'

import toUint8Array from './toUint8Array.js'

describe('toUint8Array', () => {
	it('should preserve the memory and byte range of buffers and views', () => {
		const buffer = new ArrayBuffer(16)
		const inputs = [
			['ArrayBuffer', buffer],
			['Uint8Array', new Uint8Array(buffer, 4, 8)],
			['DataView', new DataView(buffer, 4, 8)],
			['Uint16Array', new Uint16Array(buffer, 4, 4)],
			['BigUint64Array', new BigUint64Array(buffer, 0, 1)]
		]

		for (const [name, input] of inputs) {
			const bytes = toUint8Array(input)
			expect(bytes.buffer, name).to.equal(input === buffer ? buffer : input.buffer)
			expect(bytes.byteOffset, name).to.equal(input === buffer ? 0 : input.byteOffset)
			expect(bytes.byteLength, name).to.equal(input.byteLength)
		}
	})
})
