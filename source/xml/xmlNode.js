import XMLDOM from 'xmldom'

export default {
	createDocument(content) {
		return new XMLDOM.DOMParser().parseFromString(content)
	}
}