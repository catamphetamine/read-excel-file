// Using native `DOMParser` because `xpath` + `xmldom` doesn't work.
// https://github.com/goto100/xpath/issues/85
export default {
	createDocument(content) {
		// A weird bug: it won't parse XML unless it's trimmed.
		// https://github.com/catamphetamine/read-excel-file/issues/21
		return new DOMParser().parseFromString(content.trim(), 'text/xml')
	},

	select(doc, node, path, namespaces = {}) {
		const nodes = doc.evaluate(
			path,
			node || doc,
			prefix => namespaces[prefix],
			XPathResult.ANY_TYPE,
			null
		)
		// Convert iterator to an array.
		const results = []
		let result = nodes.iterateNext()
		while (result) {
			results.push(result)
			result = nodes.iterateNext()
		}
		return results
	}
}