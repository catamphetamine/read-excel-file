import testCases from './testCases.js'

export default [
	...testCases,
	{
		name: 'input-blob-in-node',
		description: 'should read from `Blob` input in Node.js'
	},
	{
		name: 'input-buffer',
		description: 'should read from `Buffer` input in Node.js'
	}
]