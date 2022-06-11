// This file is no longer used.

import xpath from 'xpath'

export default function(document, node, path, namespaces = {}) {
	const select = xpath.useNamespaces(namespaces)
	return select(path, node || document)
}