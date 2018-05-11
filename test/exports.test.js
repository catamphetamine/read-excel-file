import readXlsxFileBrowser, { Integer } from '../index.js'
import readXlsxFileNode from '../modules/readXlsxFileNode'

describe(`exports`, function()
{
	it(`should export ES6`, function()
	{
		// Browser
		readXlsxFileBrowser.should.be.a('function')
		Integer.should.be.a('function')

		// Node.js
		readXlsxFileNode.should.be.a('function')
	})

	it(`should export CommonJS`, function()
	{
		// Browser

		const Library = require('../index.commonjs')

		Library.should.be.a('function')
		Library.default.should.be.a('function')
		Library.Integer.should.be.a('function')

		// Node.js

		const readXlsxFileNode = require('../node')

		readXlsxFileNode.should.be.a('function')
		readXlsxFileNode.default.should.be.a('function')
	})
})