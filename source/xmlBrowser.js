// Turns out IE11 doesn't support XPath, so not using this code for browsers.
// https://github.com/catamphetamine/read-excel-file/issues/26
// The bundle size with `./xmlBrowser` is 190 kilobytes,
// the bundle size with `./xmlNode` is 290 kilobytes,
// so `./xmlBrowser` polyfill is about 100 kilobytes in size.
// Still, IE11 is a wide-spread browser and it's unlikely that
// anyone would ignore it for now.
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