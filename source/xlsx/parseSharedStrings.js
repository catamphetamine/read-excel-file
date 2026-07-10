import {
  onOpenTagInSharedString,
  onCloseTagInSharedString,
  onTextInSharedString,
  createInitialStateInSharedString
} from './parseSharedString.js'

/**
 * Parses `sharedStrings.xml` file.
 * @param {string} content
 * @param {function} parseXmlStream — SAX XML parser.
 * @returns {Promise<string[]>}
 */
export default function parseSharedStrings(content, parseXmlStream) {
  return parseXmlStream(content, {
    createInitialState: createInitialStateInSharedStrings,
    onOpenTag: onOpenTagInSharedStrings,
    onCloseTag: onCloseTagInSharedStrings,
    onText: onTextInSharedStrings
  }).then((state) => {
    return state.strings
  })
}

function createInitialStateInSharedStrings() {
  return {
    si: undefined,
    strings: []
  }
}

// In an XLSX `sharedStrings.xml` file, a <si/> (string item) element can have
// either a single child <t/> element (meaning that "rich formatting" is not used)
// or multiple child <r/> elements (meaning that "rich formatting" is used).
function onOpenTagInSharedStrings(tagName, attributes, state) {
  if (tagName === 'si') {
    state.si = createInitialStateInSharedString()
  } else if (state.si) {
    onOpenTagInSharedString(tagName, attributes, state.si)
  }
}

function onCloseTagInSharedStrings(tagName, state) {
  if (tagName === 'si') {
    state.strings.push(state.si.string)
    state.si = undefined
  } else if (state.si) {
    onCloseTagInSharedString(tagName, state.si)
  }
}

function onTextInSharedStrings(text, state) {
  if (state.si) {
    onTextInSharedString(text, state.si)
  }
}