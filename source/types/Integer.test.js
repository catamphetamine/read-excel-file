import { isInteger } from './Integer.js'

describe('Integer', () => {
	it('should validate an Integer', () => {
		// isInteger('1.2').should.equal(false)
		// isInteger('1').should.equal(true)
		isInteger(1.2).should.equal(false)
		isInteger(1).should.equal(true)
	})
})