import { describe, it } from 'mocha'
import { expect } from 'chai'

import fs from 'node:fs'

import readSheetNode from '../source/export/readSheetNode.js'
import readXlsxFileNode from '../source/export/readXlsxFileNode.js'

import readSheetUniversal from '../source/export/readSheetUniversal.js'
import readXlsxFileUniversal from '../source/export/readXlsxFileUniversal.js'

import TEST_CASES from './testCases.js'
import TEST_CASES_IN_NODE from './testCases.node.js'

describe('readXlsxFile', function() {
  it('should read *.xlsx files (/node)', async function() {
		// Increase the default timeout of `2000` ms.
		this.timeout(3000)
    // Run test cases.
    await runTestCases(TEST_CASES_IN_NODE, {
			getInput: filePath => filePath,
			readSheet: readSheetNode,
			readXlsxFile: readXlsxFileNode
		})
  })

  it('should read *.xlsx files (/universal)', async function() {
		// Increase the default timeout of `2000` ms.
		this.timeout(3000)
    // Run test cases.
    await runTestCases(TEST_CASES, {
			getInput: readFileSyncAsArrayBuffer,
			readSheet: readSheetUniversal,
			readXlsxFile: readXlsxFileUniversal
		})
  })
})

// Runs test cases
async function runTestCases(TEST_CASES, { getInput, readSheet, readXlsxFile }) {
	for (const testCase of TEST_CASES) {
		const testCaseId = testCase.name
		console.log('      ' + testCase.description)
		const xlsxFilePath = './test/testCases/' + testCaseId + '.xlsx'
		const jsFilePath = new URL('./testCases/' +  testCaseId + '.js', import.meta.url).href
		try {
			const testCaseFunction = await import(jsFilePath)
			await testCaseFunction.default({
				readFile: () => fs.readFileSync(xlsxFilePath),
				readSheet,
				readSheetFromFile: (...args) => readSheet(getInput(xlsxFilePath), ...args),
				readSheetsFromFile: (...args) => readXlsxFile(getInput(xlsxFilePath), ...args),
				expect
			})
		} catch (error) {
			console.error(`Error while running test case "${testCaseId}":`)
			throw error
		}
	}
}

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