import readXlsxFileBrowser, { parseExcelDate, readSheetNames } from '../index.js'
import readXlsxFileNode, { parseExcelDate as parseExcelDateNode, readSheetNames as readSheetNamesNode } from '../node/index.js'
import readXlsxFileWebWorker, { parseExcelDate as parseExcelDateWebWorker, readSheetNames as readSheetNamesWebWorker } from '../web-worker/index.js'

import Read from '../index.cjs'
import WebWorker from '../web-worker/index.cjs'
import Node from '../node/index.cjs'

describe(`exports`, () => {
	it(`should export ES6`, () => {
		// Browser
		readXlsxFileBrowser.should.be.a('function')
		parseExcelDate.should.be.a('function')
		readSheetNames.should.be.a('function')

		// Web Worker
		readXlsxFileWebWorker.should.be.a('function')
		parseExcelDateWebWorker.should.be.a('function')
		readSheetNamesWebWorker.should.be.a('function')

		// Node.js
		readXlsxFileNode.should.be.a('function')
		parseExcelDateNode.should.be.a('function')
		readSheetNamesNode.should.be.a('function')
	})

	it(`should export CommonJS`, () => {
		// Browser

		Read.should.be.a('function')
		Read.default.should.be.a('function')
		Read.parseExcelDate.should.be.a('function')
		Read.readSheetNames.should.be.a('function')

		// Web Worker.

		WebWorker.should.be.a('function')
		WebWorker.default.should.be.a('function')
		WebWorker.parseExcelDate.should.be.a('function')
		WebWorker.readSheetNames.should.be.a('function')

		// Node.js

		Node.should.be.a('function')
		Node.default.should.be.a('function')
		Node.parseExcelDate.should.be.a('function')
		Node.readSheetNames.should.be.a('function')
	})
})