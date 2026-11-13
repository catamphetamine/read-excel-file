// This file was originally submitted by Osama Ansar.
// https://github.com/catamphetamine/read-excel-file/pull/126

import { describe, it } from 'mocha'
import { expect } from 'chai'

import unescapeXlsxString from './unescapeXlsxString.js'

describe('unescapeXlsxString', () => {
	it('should decode `_xHHHH_` escape sequences', () => {
		expect(unescapeXlsxString('a_x000D__x000A_b_x0009_c')).to.equal('a\r\nb\tc')
	})

	it('should accept both uppercase and lowercase hexadecimal digits', () => {
		expect(unescapeXlsxString('_x000a_|_x000A_|_x00e9_|_x00E9_')).to.equal('\n|\n|é|é')
	})

	it('should combine surrogate pairs', () => {
		expect(unescapeXlsxString('_xD83D__xDE00_')).to.equal('\u{1F600}')
	})

	it('should decode an escaped underscore without treating what follows it as another escape', () => {
		// `_x005F_` is an escaped underscore.
		expect(unescapeXlsxString('_x005F_x0041_')).to.equal('_x0041_')
		expect(unescapeXlsxString('_x005F_x005F_')).to.equal('_x005F_')
		expect(unescapeXlsxString('a_x005F_b')).to.equal('a_b')
	})

	it('should leave things that are not escape sequences as is', () => {
		for (const string of ['', 'abc', '_x', '_x_', '_x00_', '_x00zz_', '_x000D', 'x000D_', '_X000D_', 'SW_x38_CPU', '_ x000D _']) {
			expect(unescapeXlsxString(string)).to.equal(string)
		}
	})
})