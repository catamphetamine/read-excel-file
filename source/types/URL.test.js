import { isURL } from './URL.js'

describe('URL', () => {
	it('should validate a URL', () => {
		isURL('123').should.equal(false)
		isURL('https://stackoverflow.com/questions/8667070/javascript-regular-expression-to-validate-url').should.equal(true)
	})
})