import fs from 'node:fs'
import { expect } from 'chai'

// Runs test cases
export default async function runTestCases(TEST_CASES, {
	getInputArgumentFromFilePath,
	readSheet,
	readXlsxFile
}) {
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
				readSheetFromFile: (...args) => readSheet(getInputArgumentFromFilePath(xlsxFilePath), ...args),
				readSheetsFromFile: (...args) => readXlsxFile(getInputArgumentFromFilePath(xlsxFilePath), ...args),
				expect
			})
		} catch (error) {
			console.error(`Error while running test case "${testCaseId}":`)
			throw error
		}
	}
}