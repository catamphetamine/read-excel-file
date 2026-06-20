export function createInitialState() {
	return {
		si: false,
		t: false,
		r: false,
		rPh: false,
		string: undefined
	}
}

// In an XLSX `sharedStrings.xml` file, the <si/> (string item) element can have
// either a single child <t/> element (meaning that "rich formatting" is not used)
// or multiple child <r/> elements (meaning that "rich formatting" is used).
export function onOpenTag(tagName, attributes, state) {
	if (tagName === 'si') {
		// The possible children of <si> are:
		// * <t>: Represents a simple text string. For plain text, this is the only child.
		// * <r>: Represents a rich text run. When a cell contains text where only some words are bolded, colored, or styled differently, multiple <r> elements are used to break the text into formatted segments.
		// * <rPh> (Phonetic Run): Used primarily for East Asian languages to provide phonetic reading/pronunciation data (e.g., furigana in Japanese). It associates a phonetic pronunciation run right alongside the base string text tag <t>.
		// * <phoneticPr>: Defines the phonetic properties used for East Asian languages, specifically mapping how strings should be read for sorting and pronunciation.
		state.si = true
		state.string = ''
	} else if (tagName === 't') {
		if (state.si) {
			state.t = true
		}
	} else if (tagName === 'r') {
		// The possible children of <r/> are:
		// * <rPr> (Run Properties): The formatting properties for the text (font, size, color, bold, italic, etc.).
		// * <t> (Text): The actual text payload.
		// * <rPh> (Phonetic Run): Phonetic pronunciation guidance (used for East Asian languages like Japanese). It associates a phonetic pronunciation run right alongside the base string text tag <t>.
		if (state.si) {
			state.r = true
		}
	} else if (tagName === 'rPh') {
		// The possible children of <rPh/> are:
		// * <t> (Text):  Contains the actual phonetic text or reading (usually in Katakana for Japanese) that corresponds to the associated character string.
		if (state.si) {
			state.rPh = true
		}
	}
}

export function onCloseTag(tagName, state) {
	if (tagName === 'si') {
		state.si = false
	} else if (tagName === 't') {
		state.t = false
	} else if (tagName === 'r') {
		state.r = false
	} else if (tagName === 'rPh') {
		state.rPh = false
	}
}

export function onText(text, state) {
	if (state.r) {
		if (state.t && !state.rPh) {
			state.string += text
		}
	} else if (state.t && !state.rPh) {
		state.string = text
	}
}