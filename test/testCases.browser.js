import testCases from './testCases.js'

export default [
	...testCases,
	{
		name: 'browser/input-blob',
		description: 'should read from `Blob` input in `/browser` export'
	},
	{
		name: 'browser/input-arraybufferview',
		description: 'should read from `ArrayBufferView` input in `/browser` export'
	}
]