import { describe, it } from 'mocha'
import { expect } from 'chai'

import { isInteger } from './Integer.js'

describe('Integer', () => {
	it('should validate an Integer', () => {
		expect(isInteger(1.2)).to.equal(false)
		expect(isInteger(1)).to.equal(true)
	})
})