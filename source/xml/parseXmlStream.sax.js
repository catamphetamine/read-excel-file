import { Readable } from 'node:stream'

import sax from 'sax'

// For some strange reason, using "streaming" mode results in
// quite a dramatic drop in performance.
// For example, reading a `10 MB` `.xlsx` file in "streaming" mode is about `3.1` secs.
// while in non-"streaming" mode it's about `1.4` secs.
// Because of such strange performance issue, "streaming" mode is turned off.
const STREAMING_MODE = false

export default function parseXmlStream(xml, {
	createInitialState,
	onOpenTag,
	onCloseTag,
	onText
}) {
	return new Promise((resolve, reject) => {
		let errored = false

		const strict = true
		const xmlns = true
		const parserOptions = { lowercase: true, xmlns }

		const prefixedTagNameToUnprefixedTagName = {}
		const state = createInitialState()

		// an error happened.
		const onerror = (error) => {
			if (errored) {
				return
			}
			errored = true
			reject(error)
		}

		// got some text. `text` is the string of text.
		const ontext = (text) => {
			if (onText) {
				onText(text, state)
			}
		}

		// opened a tag. `node` has "name" and "attributes"
		const onopentag = (node) => {
			if (onOpenTag) {
				if (xmlns) {
					prefixedTagNameToUnprefixedTagName[node.name] = node.local
				}
				onOpenTag(
					xmlns ? node.local : node.name,
					xmlns ? getAttributesWithoutXmlnsPrefixes(node.attributes) : node.attributes,
					state
				)
			}
		}

		// closed a tag.
		const onclosetag = (name) => {
			if (onCloseTag) {
				const tagName = xmlns ? prefixedTagNameToUnprefixedTagName[name] : name
				if (xmlns && !tagName) {
					throw new Error(`Unknown closing tag: ${name}`)
				}
				onCloseTag(tagName, state)
			}
		}

		// an attribute. `attribute` has "name" and "value"
		const onattribute = (attribute) => {
			// const name = xmlns ? attribute.local : attribute.name
			// const value = attribute.value
		}

		// parser stream is done, and ready to have more stuff written to it.
		const onend = () => {
			if (errored) {
				return
			}
			resolve(state)
		}

		if (STREAMING_MODE) {
			const parser = sax.createStream(strict, parserOptions)
			parser.on('error', onerror)
			parser.on('text', ontext)
			parser.on('opentag', onopentag)
			parser.on('closetag', onclosetag)
			parser.on('attribute', onattribute)
			parser.on('end', onend)
			Readable.from(xml).pipe(parser)
		} else {
			const parser = sax.parser(strict, parserOptions)
			parser.onerror = onerror
			parser.ontext = ontext
			parser.onopentag = onopentag
			parser.onclosetag = onclosetag
			parser.onattribute = onattribute
			parser.onend = onend
			parser.write(xml).end()
		}
	})
}

function getAttributesWithoutXmlnsPrefixes(attributes) {
  return Object.keys(attributes).reduce((attributesWithoutPrefixes, nameWithPrefix) => {
    attributesWithoutPrefixes[attributes[nameWithPrefix].local] = attributes[nameWithPrefix].value
    return attributesWithoutPrefixes
  }, {})
}