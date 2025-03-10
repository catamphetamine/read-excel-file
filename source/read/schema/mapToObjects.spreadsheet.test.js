import mapToObjects_ from './mapToObjects.js'
import mapToObjectsSpreadsheetBehavior from './mapToObjects.spreadsheet.js'

function mapToObjects(data, schema, options) {
	return mapToObjectsSpreadsheetBehavior(mapToObjects_, data, schema, options)
}

describe('mapToObjects (spreadsheet behavior)', () => {
	it('should handle missing columns / empty cells (`schemaPropertyValueForMissingColumn: null`) (`required: false`)', () => {
		const { rows, errors } = mapToObjects([
			[
				'COLUMN_2',
				'COLUMN_3',
				'COLUMN_4'
			], [
				'12',
				'13',
				'14'
			], [
				'22',
				'23',
				null
			]
		], {
			COLUMN_1: {
				prop: 'column1',
				type: String,
				required: false
			},
			COLUMN_2: {
				prop: 'column2',
				type: String,
				required: false
			},
			COLUMN_4: {
				prop: 'column4',
				type: String,
				required: false
			},
			COLUMN_5: {
				prop: 'column5',
				type: String,
				required: false
			}
		}, {
			schemaPropertyValueForMissingColumn: null
		})

		errors.should.deep.equal([])

		rows.should.deep.equal([{
			column1: null,
			column2: '12',
			column4: '14',
			column5: null
		}, {
			column1: null,
			column2: '22',
			// column4: undefined,
			column5: null
		}])
	})

	it('should handle missing columns / empty cells (`schemaPropertyValueForEmptyCell: null`) (`required: false`)', () => {
		const { rows, errors } = mapToObjects([
			[
				'COLUMN_2',
				'COLUMN_3',
				'COLUMN_4'
			], [
				'12',
				'13',
				'14'
			], [
				'22',
				'23',
				null
			]
		], {
			COLUMN_1: {
				prop: 'column1',
				type: String,
				required: false
			},
			COLUMN_2: {
				prop: 'column2',
				type: String,
				required: false
			},
			COLUMN_4: {
				prop: 'column4',
				type: String,
				required: false
			},
			COLUMN_5: {
				prop: 'column5',
				type: String,
				required: false
			}
		}, {
			schemaPropertyValueForEmptyCell: null
		})

		errors.should.deep.equal([])

		rows.should.deep.equal([{
			// column1: undefined,
			column2: '12',
			column4: '14',
			// column5: undefined
		}, {
			// column1: undefined,
			column2: '22',
			column4: null,
			// column5: undefined
		}])
	})
})
