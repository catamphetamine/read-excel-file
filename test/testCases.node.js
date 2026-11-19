import testCases from './testCases.js'

export default [
	...testCases,
	{
		name: 'node/input-blob',
		description: 'should read from `Blob` input in `/node` export'
	},
	{
		name: 'node/input-buffer',
		description: 'should read from `Buffer` input in `/node` export'
	}
]