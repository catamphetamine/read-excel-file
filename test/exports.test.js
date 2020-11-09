import readXlsxFileBrowser, { parseExcelDate } from '../index.js'
import readXlsxFileNode from '../modules/readXlsxFileNode'

describe(`exports`, () => {
	it(`should export ES6`, () => {
		// Browser
		readXlsxFileBrowser.should.be.a('function')
		parseExcelDate.should.be.a('function')

		// Node.js
		readXlsxFileNode.should.be.a('function')
	})

	it(`should export CommonJS`, () => {
		// Browser

		const Library = require('../index.commonjs')

		Library.should.be.a('function')
		Library.default.should.be.a('function')
		Library.parseExcelDate.should.be.a('function')

		// Node.js

		const Node = require('../node')

		Node.should.be.a('function')
		Node.default.should.be.a('function')
		Node.parseExcelDate.should.be.a('function')
	})
})