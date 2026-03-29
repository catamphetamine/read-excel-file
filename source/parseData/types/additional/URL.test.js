import { describe, it } from 'mocha'
import { expect } from 'chai'

import { isURL } from './URL.js'

describe('URL', () => {
	it('should validate a URL', () => {
		expect(isURL('123')).to.equal(false)
		expect(isURL('https://stackoverflow.com/questions/8667070/javascript-regular-expression-to-validate-url')).to.equal(true)
	})
})