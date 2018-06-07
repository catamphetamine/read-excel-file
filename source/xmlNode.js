import xpath from 'xpath'
import XMLDOM from 'xmldom'

export default {
	createDocument(content) {
		return new XMLDOM.DOMParser().parseFromString(content)
	},

	select(doc, node, path, namespaces = {}) {
		const select = xpath.useNamespaces(namespaces)
		return select(path, node || doc)
	}
}