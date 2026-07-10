import { describe, it } from 'mocha'

import path from 'node:path'

import readSheet from '../../source/export/readSheetNode.js'

// Enables the console output in `checkpoint.js`.
global.READ_EXCEL_FILE_CHECKPOINTS = true

const FILES = [
	// '200kb.xlsx',
	'1mb.xlsx',
	'10mb.xlsx',
	'50mb.xlsx'
]

const USE_SCHEMA = false

const SCHEMA = {
	name: {
		column: 'Name'
	},
	email: {
		column: 'Email'
	},
	phone: {
		column: 'Phone'
	},
	address: {
		column: 'Address'
	},
	company: {
		column: 'Company'
	},
	text: {
		column: 'Text'
	},
	description: {
		column: 'Description'
	},
	jobTitle: {
		column: 'Job Title'
	}
}

describe('readXlsxFile (benchmark)', () => {
	// This test case is not written using `async`/`await` syntax to work around the error:
	// "Error: Timeout of 2000ms exceeded."
	it('should read *.xlsx files of different sizes and track the time', () => {
		const test = (fileName) => {
			console.log('--------------------------------------------')
			console.log('Read', '"' + fileName + '"')
			console.log()
			const startedAt = Date.now()
			return readSheet(
				path.resolve('./test/benchmark/' + fileName),
				{ schema: USE_SCHEMA ? SCHEMA : undefined }
			).catch((error) => {
				// Don't let any potential errors, such as `schema` mismatch,
				// to interrupt the execution of the benchmark.
				console.error(error)
			}).finally(() => {
				const timeElapsed = Date.now() - startedAt
				console.log()
				console.log('Finished', 'in', timeElapsed, 'ms')
			})
		}

		// Wait for `mocha` to output its console logs ("1 passing")
		// so that it doesn't get mixed up with the benchmark log output.
		new Promise((resolve) => {
			setTimeout(resolve, 50)
		})
			.then(async () => {
				for (const fileName of FILES) {
					await test(fileName)
				}
			})
			.then(() => {
				// console.log('Finished')
			}, (error) => {
				console.error(error)
				process.exit(1)
			})
	})
})