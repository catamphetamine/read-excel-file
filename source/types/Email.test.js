import { isEmail } from './Email.js'

describe('Email', () => {
	it('should validate an Email', () => {
		isEmail('123').should.equal(false)
		isEmail('vladimir.putin@kremlin.ru').should.equal(true)
	})
})