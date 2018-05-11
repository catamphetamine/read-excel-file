import readXlsxFileBrowser, { Integer, URL, Email, parseExcelDate } from '../index.js'
import readXlsxFileNode from '../modules/readXlsxFileNode'

describe(`exports`, function()
{
	it(`should export ES6`, function()
	{
		// Browser
		readXlsxFileBrowser.should.be.a('function')
		Integer.should.be.a('function')
		URL.should.be.a('function')
		Email.should.be.a('function')
		parseExcelDate.should.be.a('function')

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
		Library.URL.should.be.a('function')
		Library.Email.should.be.a('function')
		Library.parseExcelDate.should.be.a('function')

		// Node.js

		const Node = require('../node')

		Node.should.be.a('function')
		Node.default.should.be.a('function')
		Node.Integer.should.be.a('function')
		Node.URL.should.be.a('function')
		Node.Email.should.be.a('function')
		Node.parseExcelDate.should.be.a('function')
	})
})