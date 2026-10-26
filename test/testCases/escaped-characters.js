export default async function({ readSheetFromFile, expect }) {
	const data = await readSheetFromFile()

	expect(data).to.deep.equal([
		[
			// `_x000D_`, `_x000A_` and `_x0009_` are CR, LF and TAB.
			'a\r\nb\tc',
			// `_x005F_` is an escaped underscore, so what follows it is not an escape sequence.
			'_x0041_ and _',
			// Escapes inside rich text runs.
			'line1\nline2',
			// Things that look similar but aren't escape sequences are left as is.
			'_x00zz_ _x00_ x000D _x000D',
			// A surrogate pair written as two escapes.
			'smile \u{1F600} !',
			// Inline strings, plain and rich text.
			'inl\r\nine_x0041_',
			'r1\tr2'
		]
	])
}