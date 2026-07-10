export function createInitialStateInSharedString() {
	return {
		t: false,
		r: false,
		rPh: false,
		string: ''
	}
}

// In an XLSX `sharedStrings.xml` file, a <si/> (string item) element can have
// either a single child <t/> element (meaning that "rich formatting" is not used)
// or multiple child <r/> elements (meaning that "rich formatting" is used).
export function onOpenTagInSharedString(tagName, attributes, state) {
	// The possible children of <si> are:
	// * <t>: Represents a simple text string. For plain text, this is the only child.
	// * <r>: Represents a rich text run. When a cell contains text where only some words are bolded, colored, or styled differently, multiple <r> elements are used to break the text into formatted segments.
	// * <rPh> (Phonetic Run): Used primarily for East Asian languages to provide phonetic reading/pronunciation data (e.g., furigana in Japanese). It associates a phonetic pronunciation run right alongside the base string text tag <t>.
	// * <phoneticPr>: Defines the phonetic properties used for East Asian languages, specifically mapping how strings should be read for sorting and pronunciation.
	if (tagName === 't') {
		state.t = true
	} else if (tagName === 'r') {
		// The possible children of <r/> are:
		// * <rPr> (Run Properties): The formatting properties for the text (font, size, color, bold, italic, etc.).
		// * <t> (Text): The actual text payload.
		// * <rPh> (Phonetic Run): Phonetic pronunciation guidance (used for East Asian languages like Japanese). It associates a phonetic pronunciation run right alongside the base string text tag <t>.
		state.r = true
	} else if (tagName === 'rPh') {
		// The possible children of <rPh/> are:
		// * <t> (Text):  Contains the actual phonetic text or reading (usually in Katakana for Japanese) that corresponds to the associated character string.
		state.rPh = true
	}
}

export function onCloseTagInSharedString(tagName, state) {
	if (tagName === 't') {
		state.t = false
	} else if (tagName === 'r') {
		state.r = false
	} else if (tagName === 'rPh') {
		state.rPh = false
	}
}

export function onTextInSharedString(text, state) {
	if (state.rPh) {
		// Ignore anything inside `<rPh/>` tags
	} else if (state.t) {
		if (state.r) {
			// An `<r/>` element could contain multiple `<t/>` elements,
			// the text content from all of which should be concatenated.
			state.string += text
		} else {
			state.string = text
		}
	}
}