// Starting from version `11.x`, `saxen` dropped CommonJS export.
// CommonJS compatibility was requested by one of the users of this package:
// https://gitlab.com/catamphetamine/read-excel-file/-/work_items/115
// Because of that, `saxen` source code had to be copy-pasted.
//
// import { Parser } from 'saxen'
import Parser from '../saxen/parser.js'

export default function parseXmlStream(xml, {
	createInitialState,
	onOpenTag,
	onCloseTag,
	onText
}) {
	// This function was put inside the `parseXmlStream()` function body
	// in order to prevent it from becoming an "external dependency"
	// when using `worker-f` package to run this code in a worker.
	const TAG_NAME_PREFIX = /.+:/
	function trimXmlnsPrefix(tagName) {
		return tagName.replace(TAG_NAME_PREFIX, '')
	}

	return new Promise((resolve, reject) => {
		let errored = false

		const xmlns = true

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
		const onopentag = (element, decodeEntities, selfClosing, getContext) => {
			if (onOpenTag) {
				// * `element.originalName` — The tag name as written in the XML string, retaining the original prefix regardless of the list of pre-configured namespace mappings.
				// * `element.name` — The tag name with the namespace prefix resolved against the list of pre-configured namespace mappings. I.e. the namespace prefix will potentially be replaced with one from the pre-configured namespace map.
				onOpenTag(
					xmlns ? trimXmlnsPrefix(element.originalName) : element.name,
					element.attrs,
					state
				)
			}
		}

		// closed a tag.
		const onclosetag = (element) => {
			if (onCloseTag) {
				// * `element.originalName` — The tag name as written in the XML string, retaining the original prefix regardless of the list of pre-configured namespace mappings.
				// * `element.name` — The tag name with the namespace prefix resolved against the list of pre-configured namespace mappings. I.e. the namespace prefix will potentially be replaced with one from the pre-configured namespace map.
				const tagName = xmlns ? trimXmlnsPrefix(element.originalName) : element.name
				onCloseTag(tagName, state)
			}
		}

		// `proxy: true` option enables "proxy" mode.
		//
		// In "proxy" mode, `onopentag` and `onclosetag` receive slightly different arguments:
		// * element name is replaced with element object
		// * getAttribute() function is not passed
		//
		const parser = new Parser({ proxy: true })

		// Parse XML "namespaces" (`xmlns` stuff).
		if (xmlns) {
			parser.ns()
		}

		parser.on('error', onerror)
		parser.on('text', ontext)
		parser.on('openTag', onopentag)
		parser.on('closeTag', onclosetag)

		parser.parse(xml)

		if (errored) {
			return
		}
		resolve(state)
	})
}