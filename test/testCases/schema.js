export default async function({ readSheetFromFile, expect }) {
	// should parse objects from sheet data when `schema` parameter is passed (returns `objects`)

	const schema = {
		name: {
			column: 'Name'
		},
		dateOfBirth: {
			column: 'Date of Birth',
			type: Date
		},
		income: {
			column: 'Income',
			type: Number
		},
		married: {
			column: 'Married',
			type: Boolean
		}
	}

	const { objects, errors } = await readSheetFromFile({ schema })

	expect(errors).to.be.undefined

	expect(objects).to.deep.equal([
		{
			name: 'John Smith',
			dateOfBirth: new Date(Date.UTC(2000, 1 - 1, 5)),
			income: 120000,
			married: true
		},
		{
			name: 'Alice Brown',
			dateOfBirth: new Date(Date.UTC(2005, 4 - 1, 3)),
			income: 60000,
			married: false
		}
	])

	// should parse objects from sheet data when `schema` parameter is passed (returns `errors`)

	const schemaProducesError = {
		name: {
			column: 'Absent Column',
			required: true
		},
		dateOfBirth: {
			column: 'Date of Birth',
			type: Date
		},
		income: {
			column: 'Income',
			type: Number
		},
		married: {
			column: 'Married',
			type: Boolean
		}
	}

	const { objects: objectsOnError, errors: errorsOnError } = await readSheetFromFile({ schema: schemaProducesError })

	expect(objectsOnError).to.be.undefined

	expect(errorsOnError).to.deep.equal([
		{
			error: 'required',
			row: 1,
			columnIndex: -1,
			column: 'Absent Column',
			value: undefined
		},
		{
			error: 'required',
			row: 2,
			columnIndex: -1,
			column: 'Absent Column',
			value: undefined
		}
	])
}