import readXlsxFileBrowser from '../modules/readXlsxFileBrowser'
import readXlsxFileNode from '../modules/readXlsxFileNode'

describe(`exports`, function()
{
	it(`should export ES6`, function()
	{
		readXlsxFileBrowser.should.be.a('function')
		readXlsxFileNode.should.be.a('function')
	})

	it(`should export CommonJS`, function()
	{
		const readXlsxFileBrowser = require('../commonjs/readXlsxFileBrowser').default

		readXlsxFileBrowser.should.be.a('function')

		const readXlsxFileNode = require('../commonjs/readXlsxFileNode').default

		readXlsxFileNode.should.be.a('function')
	})
})