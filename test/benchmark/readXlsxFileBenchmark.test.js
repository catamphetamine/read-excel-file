import { describe, it } from 'mocha'

import path from 'path'

import readXlsxFile from '../../source/export/readXlsxFileNode.js'

describe('readXlsxFile (benchmark)', () => {
	it('should read *.xlsx files of different sizes and track the time', () => {
		const test = (name) => {
			const startedAt = Date.now()
			return readXlsxFile(path.resolve('./test/benchmark/' + name + '.xlsx')).then(() => {
				const timeElapsed = Date.now() - startedAt
				console.log('Finished reading', name, 'data in', timeElapsed, 'ms')
			})
		}

		test('1mb')
		test('10mb')
		test('50mb')
	})
})