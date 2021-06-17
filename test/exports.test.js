import readXlsxFileBrowser, { parseExcelDate } from '../index.js'
import readXlsxFileNode, { parseExcelDate as parseExcelDateNode } from '../node'

describe(`exports`, () => {
	it(`should export ES6`, () => {
		// Browser
		readXlsxFileBrowser.should.be.a('function')
		parseExcelDate.should.be.a('function')

		// Node.js
		readXlsxFileNode.should.be.a('function')
		parseExcelDateNode.should.be.a('function')
	})

	it(`should export CommonJS`, () => {
		// Browser

		const Read = require('../index.commonjs')

		Read.should.be.a('function')
		Read.default.should.be.a('function')
		Read.parseExcelDate.should.be.a('function')

		// Node.js

		const Node = require('../node')

		Node.should.be.a('function')
		Node.default.should.be.a('function')
		Node.parseExcelDate.should.be.a('function')
	})
})