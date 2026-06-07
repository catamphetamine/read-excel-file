import { describe, it } from 'mocha'
import { expect } from 'chai'

import { Readable } from 'stream'
import { zipSync, strToU8, strFromU8 } from 'fflate'

import unzipFromStream from './unzipFromStream.js'

// Builds a `.zip` archive in memory.
// `level: 0` produces "stored" (uncompressed) entries; the default produces `DEFLATE` ones.
function createZip(entries, { level } = {}) {
	const archive = {}
	for (const name of Object.keys(entries)) {
		archive[name] = level === undefined
			? strToU8(entries[name])
			: [strToU8(entries[name]), { level }]
	}
	return Buffer.from(zipSync(archive))
}

// Emits `buffer` through a Node.js readable stream, split into `chunkSize`-byte chunks
// (to exercise reading across arbitrary chunk boundaries).
function streamFrom(buffer, { chunkSize = buffer.length } = {}) {
	const chunks = []
	for (let i = 0; i < buffer.length; i += chunkSize) {
		chunks.push(buffer.subarray(i, i + chunkSize))
	}
	return Readable.from(chunks.length > 0 ? chunks : [Buffer.alloc(0)])
}

// Reads the resulting entries back as strings for easy comparison.
function asStrings(files) {
	const result = {}
	for (const path of Object.keys(files)) {
		result[path] = strFromU8(files[path])
	}
	return result
}

describe('unzipFromStream', () => {
	it('should read DEFLATE-compressed entries from a stream', async () => {
		const zip = createZip({
			'a.xml': '<a>Hello</a>',
			'dir/b.xml': '<b>World</b>'
		})
		const files = await unzipFromStream(streamFrom(zip))
		expect(asStrings(files)).to.deep.equal({
			'a.xml': '<a>Hello</a>',
			'dir/b.xml': '<b>World</b>'
		})
	})

	it('should read "stored" (uncompressed) entries from a stream', async () => {
		const zip = createZip({ 'a.xml': '<a>Hello</a>' }, { level: 0 })
		const files = await unzipFromStream(streamFrom(zip))
		expect(asStrings(files)).to.deep.equal({ 'a.xml': '<a>Hello</a>' })
	})

	it('should read entries split across small stream chunks', async () => {
		const zip = createZip({
			'a.xml': '<a>'.repeat(500),
			'b.xml': '<b>'.repeat(500)
		})
		const files = await unzipFromStream(streamFrom(zip, { chunkSize: 7 }))
		expect(asStrings(files)).to.deep.equal({
			'a.xml': '<a>'.repeat(500),
			'b.xml': '<b>'.repeat(500)
		})
	})

	it('should ignore directory entries', async () => {
		const zip = Buffer.from(zipSync({
			'dir/': new Uint8Array(0),
			'dir/a.xml': strToU8('<a/>')
		}))
		const files = await unzipFromStream(streamFrom(zip))
		expect(asStrings(files)).to.deep.equal({ 'dir/a.xml': '<a/>' })
	})

	it('should ignore entries rejected by the `filter` option', async () => {
		const zip = createZip({
			'keep.xml': '<keep/>',
			'skip.png': 'binary'
		})
		const files = await unzipFromStream(streamFrom(zip), {
			filter: ({ path }) => path.endsWith('.xml')
		})
		expect(asStrings(files)).to.deep.equal({ 'keep.xml': '<keep/>' })
	})

	it('should reject when the source stream errors', async () => {
		const stream = new Readable({ read() {} })
		const error = new Error('Stream read failure')
		process.nextTick(() => stream.emit('error', error))

		let thrown
		try {
			await unzipFromStream(stream)
		} catch (caught) {
			thrown = caught
		}
		expect(thrown).to.equal(error)
	})

	it('should reject on invalid (non-zip) data', async () => {
		const garbage = Buffer.from('this is definitely not a zip archive')

		let thrown
		try {
			await unzipFromStream(streamFrom(garbage))
		} catch (caught) {
			thrown = caught
		}
		expect(thrown).to.be.an('error')
	})
})
