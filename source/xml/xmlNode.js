import XMLDOM from '@xmldom/xmldom'

export default {
	createDocument(content) {
		return new XMLDOM.DOMParser().parseFromString(content)
	}
}