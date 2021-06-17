// Turns out IE11 doesn't support XPath, so not using `./xpathBrowser` for browsers.
// https://github.com/catamphetamine/read-excel-file/issues/26
// The inclusion of `xpath` package in `./xpathNode`
// increases the bundle size by about 100 kilobytes.
// IE11 is a wide-spread browser and it's unlikely that
// anyone would ignore it for now.
// There could be a separate export `read-excel-file/ie11`
// for using `./xpathNode` instead of `./xpathBrowser`
// but this library has been migrated to not using `xpath` anyway.
// This code is just alternative/historical now, it seems.
export default function xpath(document, node, path, namespaces = {}) {
	const nodes = document.evaluate(
		path,
		node || document,
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