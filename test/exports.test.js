import readXlsxFileBrowser, { parseExcelDate, readSheetNames } from '../browser/index.js'
import readXlsxFileWebWorker, { parseExcelDate as parseExcelDateWebWorker, readSheetNames as readSheetNamesWebWorker } from '../web-worker/index.js'
import readXlsxFileNode, { parseExcelDate as parseExcelDateNode, readSheetNames as readSheetNamesNode } from '../node/index.js'
import readXlsxFileUniversal, { parseExcelDate as parseExcelDateUniversal, readSheetNames as readSheetNamesUniversal } from '../universal/index.js'

import BrowserCommonJs from '../browser/index.cjs'
import WebWorkerCommonJs from '../web-worker/index.cjs'
import NodeCommonJs from '../node/index.cjs'
import UniversalCommonJs from '../universal/index.cjs'

describe(`exports`, () => {
	it(`should export ESM`, () => {
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

		// Universal
		readXlsxFileUniversal.should.be.a('function')
		parseExcelDateUniversal.should.be.a('function')
		readSheetNamesUniversal.should.be.a('function')
	})

	it(`should export CommonJS`, () => {
		// Browser

		BrowserCommonJs.should.be.a('function')
		BrowserCommonJs.default.should.be.a('function')
		BrowserCommonJs.parseExcelDate.should.be.a('function')
		BrowserCommonJs.readSheetNames.should.be.a('function')

		// Web Worker.

		WebWorkerCommonJs.should.be.a('function')
		WebWorkerCommonJs.default.should.be.a('function')
		WebWorkerCommonJs.parseExcelDate.should.be.a('function')
		WebWorkerCommonJs.readSheetNames.should.be.a('function')

		// Node.js

		NodeCommonJs.should.be.a('function')
		NodeCommonJs.default.should.be.a('function')
		NodeCommonJs.parseExcelDate.should.be.a('function')
		NodeCommonJs.readSheetNames.should.be.a('function')

		// Universal

		UniversalCommonJs.should.be.a('function')
		UniversalCommonJs.default.should.be.a('function')
		UniversalCommonJs.parseExcelDate.should.be.a('function')
		UniversalCommonJs.readSheetNames.should.be.a('function')
	})
})