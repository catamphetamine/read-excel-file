import { describe, it } from 'mocha'
import { expect } from 'chai'

import fs from 'node:fs'

import readSheetNode from '../source/export/readSheetNode.js'
import readXlsxFileNode from '../source/export/readXlsxFileNode.js'

import readSheetBrowser from '../source/export/readSheetBrowser.js'
import readXlsxFileBrowser from '../source/export/readXlsxFileBrowser.js'

import readSheetWebWorker from '../source/export/readSheetWebWorker.js'
import readXlsxFileWebWorker from '../source/export/readXlsxFileWebWorker.js'

import readSheetUniversal from '../source/export/readSheetUniversal.js'
import readXlsxFileUniversal from '../source/export/readXlsxFileUniversal.js'

import TEST_CASES from './testCases.js'
import TEST_CASES_IN_NODE from './testCases.node.js'

import runTestCases from './runTestCases.js'

describe('readXlsxFile', function() {
  it('should read *.xlsx files (/node)', async function() {
		// Increase the default timeout of `2000` ms.
		this.timeout(10000)
    // Run test cases.
    await runTestCases(TEST_CASES_IN_NODE, {
			getInputArgumentFromFilePath: filePath => filePath,
			readSheet: readSheetNode,
			readXlsxFile: readXlsxFileNode
		})
  })

  it('should read *.xlsx files (/universal)', async function() {
		// Increase the default timeout of `2000` ms.
		this.timeout(10000)
    // Run test cases.
    await runTestCases(TEST_CASES, {
			getInputArgumentFromFilePath: readFileSyncAsArrayBuffer,
			readSheet: readSheetUniversal,
			readXlsxFile: readXlsxFileUniversal
		})
  })

  it('should read *.xlsx files (/browser)', async function() {
		// Increase the default timeout of `2000` ms.
		this.timeout(10000)
    // Run test cases.
    await runTestCases(TEST_CASES, {
			getInputArgumentFromFilePath: readFileSyncAsArrayBuffer,
			readSheet: readSheetBrowser,
			readXlsxFile: readXlsxFileBrowser
		})
  })

  it('should read *.xlsx files (/web-worker)', async function() {
		// Increase the default timeout of `2000` ms.
		this.timeout(10000)
    // Run test cases.
    await runTestCases(TEST_CASES, {
			getInputArgumentFromFilePath: readFileSyncAsArrayBuffer,
			readSheet: readSheetWebWorker,
			readXlsxFile: readXlsxFileWebWorker
		})
  })
})

function readFileSyncAsArrayBuffer(filePath) {
  const buffer = fs.readFileSync(filePath)
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  )
}

// async function shouldThrow(message, func) {
//   try {
//     await func()
//     throw new Error('Must throw an error')
//   } catch (error) {
//     if (error.message.includes(message)) {
//       // The error is the expected one.
//     } else {
//       console.error(error)
//       throw new Error(`Expected the error message "${error.message}" to contain "${message}"`)
//     }
//   }
// }