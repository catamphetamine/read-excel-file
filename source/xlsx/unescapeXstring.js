/**
 * Decodes the `_xHHHH_` escape sequences of the `ST_Xstring` ("Escaped String") type
 * (ECMA-376 Part 1, §22.9.2.19), which is used for the text of shared strings and inline strings.
 * Characters that can't be represented in XML (like control characters, e.g. a carriage return
 * `_x000D_`) are written as `_x` + 4 hexadecimal digits + `_`. A literal `_xHHHH_`
 * is written as `_x005F_xHHHH_`, i.e. with its leading underscore escaped.
 *
 * Matches are replaced left to right and don't overlap, so `_x005F_x0041_`
 * is decoded to `_x0041_` and not to `_A`.
 *
 * @param {string} string
 * @returns {string}
 */
export default function unescapeXstring(string) {
  // Skip the regular expression for the most common case of no escapes.
  if (string.indexOf('_x') < 0) {
    return string
  }
  return string.replace(/_x([0-9A-Fa-f]{4})_/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
}
