import { describe, it } from 'mocha'
import { expect } from 'chai'

import isPossibleFileSize from './isPossibleFileSize.js'

describe('isPossibleFileSize', () => {
	it('should validate the size of a compressed file', () => {
		const file = { compressionMethod: 8, compressedSize: 100, availableSize: 100 }
		expect(isPossibleFileSize({ ...file, uncompressedSize: 0 })).to.equal(true)
		expect(isPossibleFileSize({ ...file, uncompressedSize: 100 * 1032 })).to.equal(true)
		expect(isPossibleFileSize({ ...file, uncompressedSize: 100 * 1032 + 1 })).to.equal(false)
	})

	it('should validate the size of a "stored" (uncompressed) file', () => {
		const file = { compressionMethod: 0, compressedSize: 100, availableSize: 100 }
		expect(isPossibleFileSize({ ...file, uncompressedSize: 100 })).to.equal(true)
		expect(isPossibleFileSize({ ...file, uncompressedSize: 101 })).to.equal(false)
	})

	it('should validate that the compressed data fits in the archive', () => {
		const file = { compressionMethod: 8, compressedSize: 100, uncompressedSize: 1000 }
		expect(isPossibleFileSize({ ...file, availableSize: 100 })).to.equal(true)
		expect(isPossibleFileSize({ ...file, availableSize: 99 })).to.equal(false)
	})
})
