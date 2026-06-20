import { DOMParser } from '@xmldom/xmldom'

export default function(content) {
	return new DOMParser().parseFromString(content, 'text/xml')
}