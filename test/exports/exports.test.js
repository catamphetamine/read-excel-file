import { describe, it } from 'mocha'
import { expect } from 'chai'

import readXlsxFileBrowser, { parseSheetData as parseSheetDataBrowser, readSheet as readSheetBrowser } from '../../browser/index.js'
import readXlsxFileWebWorker, { parseSheetData as parseSheetDataWebWorker, readSheet as readSheetWebWorker } from '../../web-worker/index.js'
import readXlsxFileNode, { parseSheetData as parseSheetDataNode, readSheet as readSheetNode } from '../../node/index.js'
import readXlsxFileUniversal, { parseSheetData as parseSheetDataUniversal, readSheet as readSheetUniversal } from '../../universal/index.js'

import BrowserCommonJs from '../../browser/index.cjs'
import WebWorkerCommonJs from '../../web-worker/index.cjs'
import NodeCommonJs from '../../node/index.cjs'
import UniversalCommonJs from '../../universal/index.cjs'

describe(`exports`, () => {
	it(`should export ESM`, () => {
		// Browser
		expect(readXlsxFileBrowser).to.be.a('function')
		expect(parseSheetDataBrowser).to.be.a('function')
		expect(readSheetBrowser).to.be.a('function')

		// Web Worker
		expect(readXlsxFileWebWorker).to.be.a('function')
		expect(parseSheetDataWebWorker).to.be.a('function')
		expect(readSheetWebWorker).to.be.a('function')

		// Node.js
		expect(readXlsxFileNode).to.be.a('function')
		expect(parseSheetDataNode).to.be.a('function')
		expect(readSheetNode).to.be.a('function')

		// Universal
		expect(readXlsxFileUniversal).to.be.a('function')
		expect(parseSheetDataUniversal).to.be.a('function')
		expect(readSheetUniversal).to.be.a('function')
	})

	it(`should export CommonJS`, () => {
		// Browser

		expect(BrowserCommonJs).to.be.a('function')
		expect(BrowserCommonJs.default).to.be.a('function')
		expect(BrowserCommonJs.parseSheetData).to.be.a('function')
		expect(BrowserCommonJs.readSheet).to.be.a('function')

		// Web Worker.

		expect(WebWorkerCommonJs).to.be.a('function')
		expect(WebWorkerCommonJs.default).to.be.a('function')
		expect(WebWorkerCommonJs.parseSheetData).to.be.a('function')
		expect(WebWorkerCommonJs.readSheet).to.be.a('function')

		// Node.js

		expect(NodeCommonJs).to.be.a('function')
		expect(NodeCommonJs.default).to.be.a('function')
		expect(NodeCommonJs.parseSheetData).to.be.a('function')
		expect(NodeCommonJs.readSheet).to.be.a('function')

		// Universal

		expect(UniversalCommonJs).to.be.a('function')
		expect(UniversalCommonJs.default).to.be.a('function')
		expect(UniversalCommonJs.parseSheetData).to.be.a('function')
		expect(UniversalCommonJs.readSheet).to.be.a('function')
	})
})