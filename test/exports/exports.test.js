import { describe, it } from 'mocha'
import { expect } from 'chai'

import readXlsxFileBrowser, { parseExcelDate, readSheetNames } from '../../browser/index.js'
import readXlsxFileWebWorker, { parseExcelDate as parseExcelDateWebWorker, readSheetNames as readSheetNamesWebWorker } from '../../web-worker/index.js'
import readXlsxFileNode, { parseExcelDate as parseExcelDateNode, readSheetNames as readSheetNamesNode } from '../../node/index.js'
import readXlsxFileUniversal, { parseExcelDate as parseExcelDateUniversal, readSheetNames as readSheetNamesUniversal } from '../../universal/index.js'

import BrowserCommonJs from '../../browser/index.cjs'
import WebWorkerCommonJs from '../../web-worker/index.cjs'
import NodeCommonJs from '../../node/index.cjs'
import UniversalCommonJs from '../../universal/index.cjs'

describe(`exports`, () => {
	it(`should export ESM`, () => {
		// Browser
		expect(readXlsxFileBrowser).to.be.a('function')
		expect(parseExcelDate).to.be.a('function')
		expect(readSheetNames).to.be.a('function')

		// Web Worker
		expect(readXlsxFileWebWorker).to.be.a('function')
		expect(parseExcelDateWebWorker).to.be.a('function')
		expect(readSheetNamesWebWorker).to.be.a('function')

		// Node.js
		expect(readXlsxFileNode).to.be.a('function')
		expect(parseExcelDateNode).to.be.a('function')
		expect(readSheetNamesNode).to.be.a('function')

		// Universal
		expect(readXlsxFileUniversal).to.be.a('function')
		expect(parseExcelDateUniversal).to.be.a('function')
		expect(readSheetNamesUniversal).to.be.a('function')
	})

	it(`should export CommonJS`, () => {
		// Browser

		expect(BrowserCommonJs).to.be.a('function')
		expect(BrowserCommonJs.default).to.be.a('function')
		expect(BrowserCommonJs.parseExcelDate).to.be.a('function')
		expect(BrowserCommonJs.readSheetNames).to.be.a('function')

		// Web Worker.

		expect(WebWorkerCommonJs).to.be.a('function')
		expect(WebWorkerCommonJs.default).to.be.a('function')
		expect(WebWorkerCommonJs.parseExcelDate).to.be.a('function')
		expect(WebWorkerCommonJs.readSheetNames).to.be.a('function')

		// Node.js

		expect(NodeCommonJs).to.be.a('function')
		expect(NodeCommonJs.default).to.be.a('function')
		expect(NodeCommonJs.parseExcelDate).to.be.a('function')
		expect(NodeCommonJs.readSheetNames).to.be.a('function')

		// Universal

		expect(UniversalCommonJs).to.be.a('function')
		expect(UniversalCommonJs.default).to.be.a('function')
		expect(UniversalCommonJs.parseExcelDate).to.be.a('function')
		expect(UniversalCommonJs.readSheetNames).to.be.a('function')
	})
})