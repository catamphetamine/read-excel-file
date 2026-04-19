import { describe, it } from 'mocha'
import { expect } from 'chai'

import { isEmail } from './Email.js'

describe('Email', () => {
	it('should validate an Email', () => {
		expect(isEmail('123')).to.equal(false)
		expect(isEmail('vladimir.putin@kremlin.ru')).to.equal(true)
	})
})