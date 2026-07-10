import parseCellValue from './parseCellValue.js'
import parseCellAddress from './parseCellAddress.js'

// Example of a `<c/>`ell element:
//
// <c>
//    <f>string</f> — formula.
//    <v>string</v> — formula pre-computed value.
//    <is>
//       <t>string</t> — an `inlineStr` string (rather than a "common string" from a dictionary).
//       <r>
//          <rPr>
//            ...
//          </rPr>
//          <t>string</t>
//       </r>
//       <rPh sb="1" eb="1">
//          <t>string</t>
//       </rPh>
//       <phoneticPr fontId="1"/>
//    </is>
//    <extLst>
//       <ext>
//          <!--any element-->
//       </ext>
//    </extLst>
// </c>
//
export default function parseCell(
  attributes,
  value,
  inlineString,
  sharedStrings,
  styles,
  epoch1904,
  options
) {
  const [row, column] = parseCellAddress(attributes.r)
  const type = attributes.t
  const styleId = attributes.s ? Number(attributes.s) : undefined

  return {
    row,
    column,
    value: parseCellValue(value, type, {
      inlineString,
      styleId,
      styles,
      sharedStrings,
      epoch1904,
      options
    })
  }
}

export function createInitialStateInCell() {
  return {
    v: false,
    is: false,
    t: false,
    r: false,
    rPh: false,
    value: undefined,
    inlineString: undefined,
    attributes: undefined
  }
}

export function onOpenTagInCell(tagName, attributes, state) {
  if (tagName === 'v') {
    state.v = true
  } else if (tagName === 'is') {
    // The possible children of <is> are:
    // * <t> (Text): The standard child to hold plain, simple text.
    // * <r> (Rich Text Run): Used for applying different formatting styles (like bold or italic) to specific segments of text within a single cell.
    // * <rPh> (Phonetic Run): Used primarily for East Asian languages to provide phonetic reading/pronunciation data (e.g., furigana in Japanese). It associates a phonetic pronunciation run right alongside the base string text tag <t>.
    // * <phoneticPr> (Phonetic Properties): Defines formatting and settings for the phonetic text.
    state.is = true
    state.inlineString = ''
  } else if (tagName === 't') {
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

export function onCloseTagInCell(tagName, state) {
  if (tagName === 'v') {
    state.v = false
  } else if (tagName === 'is') {
    state.is = false
  } else if (tagName === 't') {
    state.t = false
  } else if (tagName === 'r') {
    state.r = false
  } else if (tagName === 'rPh') {
    state.rPh = false
  }
}

export function onTextInCell(text, state) {
  if (state.v) {
    state.value = text
  } else if (state.is) {
    if (state.rPh) {
      // Ignore anything inside `<rPh/>` tags
    } else if (state.t) {
      if (state.r) {
        // An `<r/>` element could contain multiple `<t/>` elements,
        // the text content from all of which should be concatenated.
        state.inlineString += text
      } else {
        state.inlineString = text
      }
    }
  }
}
