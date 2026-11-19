import { describe, it } from 'mocha'
import { expect } from 'chai'

import { zipSync, strToU8 } from 'fflate'

import unzipFromUint8Array from './unzipFromUint8Array.js'

describe('unzipFromUint8Array', () => {
	it('should read a `.zip` archive', async () => {
		const zip = zipSync({ 'a.xml': strToU8('<a/>') })
		const files = await unzipFromUint8Array(zip)
		expect(Object.keys(files)).to.deep.equal(['a.xml'])
	})
})