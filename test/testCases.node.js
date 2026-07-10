import testCases from './testCases.js'

export default [
	...testCases,
	{
		name: 'node/input-blob',
		description: 'should read from `Blob` input in Node.js'
	},
	{
		name: 'node/input-buffer',
		description: 'should read from `Buffer` input in Node.js'
	}
]