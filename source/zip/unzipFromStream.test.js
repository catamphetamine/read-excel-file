// This code was originally submitted by Stian Jensen.
// https://github.com/catamphetamine/read-excel-file/pull/122

import { describe, it } from 'mocha'
import { expect } from 'chai'

import { Readable } from 'node:stream'
import { zipSync, strToU8, strFromU8 } from 'fflate'

import unzipFromStream from './unzipFromStream.js'

describe('unzipFromStream', () => {
	it('should read DEFLATE-compressed entries from a stream', async () => {
		const zip = createZip({
			'a.xml': '<a>Hello</a>',
			'dir/b.xml': '<b>World</b>'
		})
		const files = await unzipFromStream(createStreamFromBuffer(zip))
		expect(convertValuesFromBufferToString(files)).to.deep.equal({
			'a.xml': '<a>Hello</a>',
			'dir/b.xml': '<b>World</b>'
		})
	})

	it('should read "stored" (uncompressed) entries from a stream', async () => {
		const zip = createZip({ 'a.xml': '<a>Hello</a>' }, { level: 0 })
		const files = await unzipFromStream(createStreamFromBuffer(zip))
		expect(convertValuesFromBufferToString(files)).to.deep.equal({ 'a.xml': '<a>Hello</a>' })
	})

	it('should read entries split across small stream chunks', async () => {
		const zip = createZip({
			'a.xml': '<a>'.repeat(500),
			'b.xml': '<b>'.repeat(500)
		})
		const files = await unzipFromStream(createStreamFromBuffer(zip, { chunkSize: 7 }))
		expect(convertValuesFromBufferToString(files)).to.deep.equal({
			'a.xml': '<a>'.repeat(500),
			'b.xml': '<b>'.repeat(500)
		})
	})

	it('should ignore directory entries', async () => {
		const zip = Buffer.from(zipSync({
			'dir/': new Uint8Array(0),
			'dir/a.xml': strToU8('<a/>')
		}))
		const files = await unzipFromStream(createStreamFromBuffer(zip))
		expect(convertValuesFromBufferToString(files)).to.deep.equal({ 'dir/a.xml': '<a/>' })
	})

	it('should ignore entries rejected by the `filter` option', async () => {
		const zip = createZip({
			'keep.xml': '<keep/>',
			'skip.png': 'binary'
		})
		const files = await unzipFromStream(createStreamFromBuffer(zip), {
			filter: ({ path }) => path.endsWith('.xml')
		})
		expect(convertValuesFromBufferToString(files)).to.deep.equal({ 'keep.xml': '<keep/>' })
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
			await unzipFromStream(createStreamFromBuffer(garbage))
		} catch (caught) {
			thrown = caught
		}
		expect(thrown).to.be.an('error')
	})
})


// Builds a `.zip` archive (in memory) from a map of text files.
//
// Accepts `fflate`'s `zipSync()` function options as the optional second argument.
// For example, passing `level: 0` will produce a `.zip` file with no compression.
//
// Returns a `Buffer`.
//
function createZip(files, { level } = {}) {
	const entries = {}
	for (const name of Object.keys(files)) {
		entries[name] = strToU8(files[name])
	}
	return Buffer.from(zipSync(entries, { level }))
}

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

// Converts the values in the given object from `Buffer` to UTF-8 `string`.
function convertValuesFromBufferToString(object) {
	const convertedObject = {}
	for (const path of Object.keys(object)) {
		convertedObject[path] = strFromU8(object[path])
	}
	return convertedObject
}