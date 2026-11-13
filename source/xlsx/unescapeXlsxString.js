// This file was originally submitted by Osama Ansar.
// https://github.com/catamphetamine/read-excel-file/pull/126

/**
 * Decodes the `_xHHHH_` escape sequences of the `ST_Xstring` ("Escaped String") type
 * (ECMA-376 Part 1, §22.9.2.19), which is used in `.xlsx` files to encode characters
 * that're considered illegal in the XML 1.0 specification.
 *
 * One might ask: "For those characters, why not simply use XML's own escaping mechanism?".
 * I.e. why not simply encode illegal characters as "&#xHHHH;"? The answer is: the XML 1.0 specification
 * doesn't allow using the entire range `0000`...`HHHH` when escaping characters via "&#xHHHH;".
 * Specifically, it doesn't allow "control characters" such as "carriage return" or "backspace"
 * be encoded that way. For example, "&#x0008;" character sequence (backspace) is illegal in XML 1.0.
 * Later, XML 1.1 fixed this by allowing any character sequence except for "&#x0000;". But despite
 * the specification change, XML 1.1 is rarely supported by modern parsers, browsers, and web services.
 * Relying on it usually breaks interoperability, and the XLSX specification is based on XML 1.0 anyway.
 *
 * So in XLSX specification, illegal XML characters are written as `_x` + 4 hexadecimal digits + `_`.
 * And when there's a legitimate subtring "_xHHHH_" that shouldn't be confused with an escaped character,
 * it is written as `_x005F_xHHHH_`, i.e. with its leading "_" character escaped, and the rest characters
 * left untouched.
 *
 * When decoding an "_xHHHH_" substrings in a string, matches are replaced left to right and don't overlap,
 * so `_x005F_x0041_` is decoded as "_x0041_" and not as "_A".
 *
 * @param {string} string
 * @returns {string}
 */
export default function unescapeXlsxString(string) {
	// Skip the regular expression for the most common case of no escapes.
	// Performing this check results in significantly better performance
	// compared to if it jumped right to the execution of the regexp below.
	//
	// Why it's faster:
	//
	// * Fast-path rejection: If "_x" is absent, .indexOf("_x") bails out in nanoseconds
	//   without ever touching the regex engine or allocating match arrays.
	// * Reduced engine overhead: Invoking .replace(), .match(), or .exec() with a global regexp
	//   carries setup and state-tracking overhead, even when there is no match.
	// * SIMD optimization: Substring searches for short, fixed literals like "_x"
	//   are heavily optimized at the hardware level in modern JS runtimes.
	//
	if (string.indexOf('_x') < 0) {
		return string
	}
	return string.replace(/_x([0-9A-Fa-f]{4})_/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
}