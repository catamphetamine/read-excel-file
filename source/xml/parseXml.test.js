import { describe, it } from 'mocha'
import { expect } from 'chai'

import parseXml from './parseXml.js'

describe('parseXmlStream', () => {
	it('should decode numeric character references in text', async () => {
		// Some tools (e.g. `openpyxl`) escape non-ASCII characters when writing XML.
		expect(await parseXmlTextContent('<r><t>Caf&#233; &#xE9;t&#xE9;</t></r>')).to.equal('Café été')
	})

	it('should decode predefined XML entities in text', async () => {
		expect(await parseXmlTextContent('<r><t>&lt;a&gt; &amp; &quot;b&quot; &apos;c&apos;</t></r>')).to.equal('<a> & "b" \'c\'')
	})

	it('should pass text without character references through unchanged', async () => {
		expect(await parseXmlTextContent('<r><t>abc</t></r>')).to.equal('abc')
	})

	it('should decode character references in attribute values', async () => {
		// Sheet names are read from the `name` attribute
		// in `xl/workbook.xml` file: `<sheet name="P&amp;L"/>`.
		const state = { names: [] }
		const onOpenTag = (tagName, attributes, state) => {
			if (tagName === 'sheet') {
				state.names.push(attributes.name)
			}
		}
		await parseXml(
			'<sheets><sheet name="P&amp;L &#233;t&#xE9;"/></sheets>',
			state,
			onOpenTag,
			null,
			null
		)
		expect(state.names).to.deep.equal(['P&L été'])
	})
})

describe('parseXml (in chunks)', () => {
	it('should not grow the call stack with each chunk', async () => {
		const originalStackTraceLimit = Error.stackTraceLimit
		Error.stackTraceLimit = Infinity
		try {
			const stackDepths = []
			const onProgress = () => {
				stackDepths.push(new Error().stack.split('\n').length)
			}
			// Large relative to the initial 64 KB chunk size, so that there're several chunks
			// even when every chunk is fast enough for the chunk size to keep doubling.
			const xmlLength = 8 * 1024 * 1024
			expect(await countElementsParsedInChunks(xmlLength, onProgress)).to.equal(xmlLength / ELEMENT.length)
			expect(stackDepths.length).to.be.above(2)
			expect(new Set(stackDepths).size).to.equal(1)
		} finally {
			Error.stackTraceLimit = originalStackTraceLimit
		}
	})

	it('should not shrink the chunk size indefinitely when every chunk is slow to process', async () => {
		const xmlLength = 256 * 1024
		// The chunk size halves from 64 KB down to the 16 KB minimum and then stays there.
		const maxChunksCount = xmlLength / (16 * 1024) + 1
		let chunksCount = 0
		const onProgress = () => {
			// Fail fast rather than loop forever if the chunk size ever shrinks to nothing.
			if (++chunksCount > maxChunksCount) {
				throw new Error(`Expected at most ${maxChunksCount} chunks`)
			}
			// Make every chunk take longer than the maximum chunk processing time.
			const startedAt = Date.now()
			while (Date.now() - startedAt < 10) {
				// Busy-wait.
			}
		}
		expect(await countElementsParsedInChunks(xmlLength, onProgress)).to.equal(xmlLength / ELEMENT.length)
	})
})

const ELEMENT = '<c/>'

function countElementsParsedInChunks(xmlLength, onProgress) {
	const state = { count: 0 }
	const onOpenTag = (tagName, attributes, state) => {
		if (tagName === 'c') {
			state.count++
		}
	}
	const xml = '<r>' + ELEMENT.repeat(xmlLength / ELEMENT.length) + '</r>'
	return parseXml(xml, state, onOpenTag, null, null, onProgress).then(() => state.count)
}

function parseXmlTextContent(xml) {
	const state = { text: '' }
	const onText = (text, state) => {
		state.text += text
	}
	return parseXml(
		xml,
		state,
		null,
		null,
		onText
	).then(() => state.text)
}
