export default {
	createDocument(content) {
		// A weird bug: it won't parse XML unless it's trimmed.
		// https://github.com/catamphetamine/read-excel-file/issues/21
		return new DOMParser().parseFromString(content.trim(), 'text/xml')
	}
}