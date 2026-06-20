import { readSharedStrings } from '../xml/xlsx.js'

import {
  onOpenTag as onOpenTagPotentiallyRelatedToSharedString,
  onCloseTag as onCloseTagPotentiallyRelatedToSharedString,
  onText as onTextPotentiallyRelatedToSharedString,
  createInitialState as createInitialStateForSharedString
} from './parseSharedString.js'

/**
 * Parses `sharedStrings.xml` file.
 * @param {string} content
 * @param {function} parseXmlTree — Parses an XML string into a DOM tree.
 * @param {function} [parseXmlStream] — (optional) "streaming" XML parser. Using "streaming" also requires Node.js because it uses Node.js streams.
 * @returns {Promise<string[]>}
 */
export default function parseSharedStrings(content, parseXmlTree, parseXmlStream) {
  if (parseXmlStream) {
    return parseXmlStream(content, {
      createInitialState,
      onOpenTag,
      onCloseTag,
      onText
    }).then((state) => {
      return state.strings
    })
  } else {
    return new Promise((resolve) => {
      const state = createInitialState()
      const document = parseXmlTree(content)
      readSharedStrings(document, onOpenTag, onCloseTag, onText, state)
      resolve(state.strings)
    })
  }
}

function createInitialState() {
  return {
    sst: false,
    strings: [],
    stateForSharedString: undefined
  }
}

// In an XLSX `sharedStrings.xml` file, the <si/> (string item) element can have
// either a single child <t/> element (meaning that "rich formatting" is not used)
// or multiple child <r/> elements (meaning that "rich formatting" is used).
function onOpenTag(tagName, attributes, state) {
  if (tagName === 'sst') {
    state.sst = true
  } else if (state.sst) {
    if (tagName === 'si') {
      state.stateForSharedString = createInitialStateForSharedString()
    }
    onOpenTagPotentiallyRelatedToSharedString(tagName, attributes, state.stateForSharedString)
  }
}

function onCloseTag(tagName, state) {
  if (tagName === 'sst') {
    state.sst = false
  } else if (state.sst) {
    onCloseTagPotentiallyRelatedToSharedString(tagName, state.stateForSharedString)
    if (tagName === 'si') {
      state.strings.push(state.stateForSharedString.string)
      state.stateForSharedString = undefined
    }
  }
}

function onText(text, state) {
  if (state.sst) {
    onTextPotentiallyRelatedToSharedString(text, state.stateForSharedString)
  }
}