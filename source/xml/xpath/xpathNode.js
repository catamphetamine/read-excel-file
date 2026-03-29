// This file is no longer used.

import xpath from 'xpath'

export default function(document, element, path, namespaces = {}) {
	const select = xpath.useNamespaces(namespaces)
	return select(path, element || document)
}