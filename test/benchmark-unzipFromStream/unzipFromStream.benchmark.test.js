import fs from 'node:fs'

import unzipFromStreamUsingFflate from '../../source/zip/unzipFromStream.fflate.js'
import unzipFromStreamUsingUnzipper from '../../source/zip/unzipFromStream.unzipper.js'

const IMPLEMENTATIONS =  [{
	name: 'fflate',
	unzipFromStream: unzipFromStreamUsingFflate
}, {
	name: 'unzipper',
	unzipFromStream: unzipFromStreamUsingUnzipper
}]

describe('unzipFromStream (benchmark)', () => {
	it('should compare different implementations', async () => {
		for (const { name, unzipFromStream } of IMPLEMENTATIONS) {
			const archiveName = '50mb'
			const stream = fs.createReadStream(`./test/benchmark/${archiveName}.xlsx`)
			const startedAt = Date.now()
			await unzipFromStream(stream)
			const timeElapsed = Date.now() - startedAt
			console.log(name, 'reads', archiveName, 'in', timeElapsed, 'ms')
		}
	})
})