import { DOMParser } from '@xmldom/xmldom'

export default {
	createDocument(content) {
		return new DOMParser().parseFromString(content)
	}
}