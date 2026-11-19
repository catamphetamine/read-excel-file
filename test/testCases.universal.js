import testCases from './testCases.js'

export default [
	...testCases,
	{
		name: 'universal/input-blob',
		description: 'should read from `Blob` input in `/universal` export'
	},
	{
		name: 'universal/input-arraybufferview',
		description: 'should read from `ArrayBufferView` input in `/universal` export'
	}
]