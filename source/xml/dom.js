export function findChild(node, tagName) {
	let i = 0
	while (i < node.childNodes.length) {
		const childNode = node.childNodes[i]
		// `nodeType: 1` means "Element".
		// https://www.w3schools.com/xml/prop_element_nodetype.asp
		if (childNode.nodeType === 1 && childNode.tagName === tagName) {
			return childNode
		}
		i++
	}
}

export function findChildren(node, tagName) {
	const results = []
	let i = 0
	while (i < node.childNodes.length) {
		const childNode = node.childNodes[i]
		// `nodeType: 1` means "Element".
		// https://www.w3schools.com/xml/prop_element_nodetype.asp
		if (childNode.nodeType === 1 && childNode.tagName === tagName) {
			results.push(childNode)
		}
		i++
	}
	return results
}

export function forEach(node, tagName, func) {
	// if (typeof tagName === 'function') {
	// 	func = tagName
	// 	tagName = undefined
	// }
	let i = 0
	while (i < node.childNodes.length) {
		const childNode = node.childNodes[i]
		if (tagName) {
			// `nodeType: 1` means "Element".
			// https://www.w3schools.com/xml/prop_element_nodetype.asp
			if (childNode.nodeType === 1 && childNode.tagName === tagName) {
				func(childNode, i)
			}
		} else {
			func(childNode, i)
		}
		i++
	}
}

export function map(node, tagName, func) {
	const results = []
	forEach(node, tagName, (node, i) => {
		results.push(func(node, i))
	})
	return results
}