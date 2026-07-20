import { describe, it } from 'mocha'
import { expect } from 'chai'

import parseXmlStream from './parseXmlStream.js'

function collectText(xml) {
	return parseXmlStream(xml, {
		createInitialState: () => ({ text: '' }),
		onText: (text, state) => {
			state.text += text
		}
	}).then(state => state.text)
}

describe('parseXmlStream', () => {
	it('should decode numeric character references in text', async () => {
		// Some tools (e.g. `openpyxl`) escape non-ASCII characters
		// as numeric character references when writing XML.
		expect(await collectText('<r><t>Caf&#233; &#xE9;t&#xE9;</t></r>')).to.equal('Café été')
	})

	it('should decode predefined XML entities in text', async () => {
		expect(await collectText('<r><t>&lt;a&gt; &amp; &quot;b&quot; &apos;c&apos;</t></r>')).to.equal('<a> & "b" \'c\'')
	})

	it('should pass text without character references through unchanged', async () => {
		expect(await collectText('<r><t>abc</t></r>')).to.equal('abc')
	})

	it('should decode character references in attribute values', async () => {
		// Sheet names, for example, are read from the `name` attribute
		// in `xl/workbook.xml`: `<sheet name="P&amp;L"/>`.
		const state = await parseXmlStream('<sheets><sheet name="P&amp;L &#233;t&#xE9;"/></sheets>', {
			createInitialState: () => ({ names: [] }),
			onOpenTag: (tagName, attributes, state) => {
				if (tagName === 'sheet') {
					state.names.push(attributes.name)
				}
			}
		})
		expect(state.names).to.deep.equal(['P&L été'])
	})
})
